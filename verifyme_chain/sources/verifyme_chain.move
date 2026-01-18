module verifyme_chain::verifyme_chain {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::tx_context;
    use sui::transfer;
    use sui::table;
    use sui::event;
    use std::option;
    use std::option::Option;
    use std::vector;

    /***************
     * ENUM-LIKES
     ***************/
    /// issuer_type: 1 = COOP, 2 = NON_COOP
    const ISSUER_COOP: u8 = 1;
    const ISSUER_NON_COOP: u8 = 2;

    /// verification_level: 0 = none, 1 = DNS, 2 = LEGAL
    const LVL_NONE: u8 = 0;
    const LVL_DNS: u8 = 1;
    const LVL_LEGAL: u8 = 2;

    /// status: 1 = ACTIVE, 2 = SUSPENDED, 3 = REVOKED
    const ST_ACTIVE: u8 = 1;
    const ST_SUSPENDED: u8 = 2;
    const ST_REVOKED: u8 = 3;

    /// credential status: 1 = ISSUED, 2 = VERIFIED, 3 = REVOKED
    const CRED_ISSUED: u8 = 1;
    const CRED_VERIFIED: u8 = 2;
    const CRED_REVOKED: u8 = 3;

    /// action: 1=ISSUE, 2=VERIFY, 3=CLAIM, 4=REVOKE, 5=REGISTER_ISSUER, 6=UPGRADE_ISSUER
    const ACT_ISSUE: u8 = 1;
    const ACT_VERIFY: u8 = 2;
    const ACT_CLAIM: u8 = 3;
    const ACT_REVOKE: u8 = 4;
    const ACT_REGISTER_ISSUER: u8 = 5;
    const ACT_UPGRADE_ISSUER: u8 = 6;

    /// verification_method: 1=ONCHAIN, 2=EXTERNAL, 3=LEGAL, 4=DNS
    const VM_ONCHAIN: u8 = 1;
    const VM_EXTERNAL: u8 = 2;
    const VM_LEGAL: u8 = 3;
    const VM_DNS: u8 = 4;

    /// result: 1=SUCCESS, 2=FAIL
    const RES_SUCCESS: u8 = 1;
    const RES_FAIL: u8 = 2;

    /***************
     * CAPS / ROOT
     ***************/
    /// AdminCap: ai giữ cap này mới “approve DNS/legal”, “verify external”, v.v.
    public struct AdminCap has key {
        id: UID,
    }

    /// Registry root object (singleton) – giữ tables + counters
    public struct VerifyMeRegistry has key {
        id: UID,

        next_issuer_id: u64,
        next_credential_id: u64,

        issuers: table::Table<u64, IssuerRecord>,
        issuer_bindings: table::Table<u64, IssuerIdentityBinding>,
        credentials: table::Table<u64, CredentialRecord>,
    }

    /***************
     * DATA MODELS
     ***************/
    public struct IssuerRecord has store {
        issuer_id: u64,
        issuer_address: address,
        issuer_type: u8,            // COOP | NON_COOP
        verification_level: u8,     // 0|1|2
        status: u8,                 // ACTIVE|SUSPENDED|REVOKED
        created_at_ms: u64,
        updated_at_ms: u64,

        /// Optional: các “pending” request để admin approve
        pending_domain_hash: Option<vector<u8>>,
        pending_legal_doc_hash: Option<vector<u8>>,
    }

    /// Optional binding object: lưu hash domain / legal doc đã được approve ở level tương ứng
    public struct IssuerIdentityBinding has store {
        issuer_id: u64,
        domain_hash: Option<vector<u8>>,
        legal_doc_hash: Option<vector<u8>>,
    }

    public struct CredentialRecord has store {
        credential_id: u64,
        issuer_id: u64,
        credential_type: vector<u8>,   // e.g. b"IELTS"
        issued_at_ms: u64,
        status: u8,                   // ISSUED|VERIFIED|REVOKED

        owner_address: Option<address>,
        cccd_hash: Option<vector<u8>>,  // nếu chưa claim

        data_hash: vector<u8>,         // hash metadata/file offchain
    }

    /***************
     * EVENTS (append-only)
     ***************/
    public struct VerificationEvent has copy, drop, store {
        event_id: vector<u8>,          // có thể dùng b"issuer:1:upgrade:dns" ... hoặc random offchain
        credential_id: Option<u64>,
        issuer_id: Option<u64>,
        action: u8,                    // ISSUE|VERIFY|CLAIM|REVOKE|...
        verification_method: u8,       // ONCHAIN|EXTERNAL|LEGAL|DNS
        result: u8,                    // SUCCESS|FAIL
        timestamp_ms: u64,
        actor: address,
        note_hash: Option<vector<u8>>, // hash “evidence bundle” off-chain (pdf/legal/dns proof)
    }

    /***************
     * ERRORS
     ***************/
    const E_NOT_ADMIN: u64 = 1;
    const E_ISSUER_NOT_FOUND: u64 = 2;
    const E_CRED_NOT_FOUND: u64 = 3;
    const E_BAD_STATUS: u64 = 4;
    const E_NOT_ISSUER_OWNER: u64 = 5;
    const E_ISSUER_NOT_ACTIVE: u64 = 6;
    const E_ISSUER_NOT_COOP: u64 = 7;
    const E_LEVEL_TOO_LOW: u64 = 8;
    const E_ALREADY_CLAIMED: u64 = 9;
    const E_CCCD_MISMATCH: u64 = 10;
    const E_NOT_OWNER: u64 = 11;

    /***************
     * INIT
     ***************/
    /// Deploy xong gọi init để tạo registry + admin cap.
    fun init(ctx: &mut TxContext) {
        let admin = AdminCap { id: sui::object::new(ctx) };

        let issuers = table::new(ctx);
        let issuer_bindings = table::new(ctx);
        let credentials = table::new(ctx);

        let reg = VerifyMeRegistry {
            id: sui::object::new(ctx),
            next_issuer_id: 1,
            next_credential_id: 1,
            issuers,
            issuer_bindings,
            credentials,
        };

        // ai gọi init sẽ nhận admin cap + registry object
        transfer::transfer(admin, tx_context::sender(ctx));
        transfer::share_object(reg);
    }

    /***************
     * ADMIN HELPERS
     ***************/
    fun assert_admin(_cap: &AdminCap) {
        // sở hữu AdminCap đã đủ; không cần check sender
    }

    /***************
     * ISSUER FLOWS
     ***************/
    /// Issuer đăng ký tham gia (COOP hoặc NON_COOP).
    public entry fun register_issuer(
        reg: &mut VerifyMeRegistry,
        issuer_type: u8,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        // issuer_type chỉ cho 1 hoặc 2
        assert!(issuer_type == ISSUER_COOP || issuer_type == ISSUER_NON_COOP, E_BAD_STATUS);

        let issuer_id = reg.next_issuer_id;
        reg.next_issuer_id = issuer_id + 1;

        let sender = tx_context::sender(ctx);

        let rec = IssuerRecord {
            issuer_id,
            issuer_address: sender,
            issuer_type,
            verification_level: LVL_NONE,
            status: ST_ACTIVE,
            created_at_ms: now_ms,
            updated_at_ms: now_ms,
            pending_domain_hash: option::none<vector<u8>>(),
            pending_legal_doc_hash: option::none<vector<u8>>(),
        };

        table::add(&mut reg.issuers, issuer_id, rec);

        // tạo binding rỗng (optional nhưng tiện)
        let bind = IssuerIdentityBinding {
            issuer_id,
            domain_hash: option::none<vector<u8>>(),
            legal_doc_hash: option::none<vector<u8>>(),
        };
        table::add(&mut reg.issuer_bindings, issuer_id, bind);

        event::emit(VerificationEvent{
            event_id: b"register_issuer",
            credential_id: option::none(),
            issuer_id: option::some(issuer_id),
            action: ACT_REGISTER_ISSUER,
            verification_method: VM_ONCHAIN,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: sender,
            note_hash: option::none(),
        });
    }

    /// Issuer (COOP) gửi request xác thực DNS: cung cấp domain_hash + evidence hash (off-chain bundle).
    public entry fun request_dns_verification(
        reg: &mut VerifyMeRegistry,
        issuer_id: u64,
        domain_hash: vector<u8>,
        evidence_hash: Option<vector<u8>>,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let rec_ref = table::borrow_mut(&mut reg.issuers, issuer_id);
        assert!(rec_ref.issuer_address == sender, E_NOT_ISSUER_OWNER);
        assert!(rec_ref.status == ST_ACTIVE, E_ISSUER_NOT_ACTIVE);
        assert!(rec_ref.issuer_type == ISSUER_COOP, E_ISSUER_NOT_COOP);

        rec_ref.pending_domain_hash = option::some(domain_hash);
        rec_ref.updated_at_ms = now_ms;

        event::emit(VerificationEvent{
            event_id: b"request_dns",
            credential_id: option::none(),
            issuer_id: option::some(issuer_id),
            action: ACT_UPGRADE_ISSUER,
            verification_method: VM_DNS,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: sender,
            note_hash: evidence_hash,
        });
    }

    /// Admin approve DNS => verification_level = max(level, 1) + ghi domain_hash vào binding
    public entry fun approve_dns(
        cap: &AdminCap,
        reg: &mut VerifyMeRegistry,
        issuer_id: u64,
        approve: bool,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        assert_admin(cap);
        let admin = tx_context::sender(ctx);

        let rec_ref = table::borrow_mut(&mut reg.issuers, issuer_id);
        assert!(rec_ref.status == ST_ACTIVE, E_ISSUER_NOT_ACTIVE);

        if (!approve) {
            // reject => clear pending
            rec_ref.pending_domain_hash = option::none<vector<u8>>();
            rec_ref.updated_at_ms = now_ms;

            event::emit(VerificationEvent{
                event_id: b"approve_dns",
                credential_id: option::none(),
                issuer_id: option::some(issuer_id),
                action: ACT_UPGRADE_ISSUER,
                verification_method: VM_DNS,
                result: RES_FAIL,
                timestamp_ms: now_ms,
                actor: admin,
                note_hash: option::none(),
            });
            return;
        };

        // approve true: lấy pending_domain_hash -> set binding.domain_hash
        let pending = rec_ref.pending_domain_hash;
    rec_ref.pending_domain_hash = option::none<vector<u8>>();

        if (option::is_some(&pending)) {
            let bind_ref = table::borrow_mut(&mut reg.issuer_bindings, issuer_id);
            bind_ref.domain_hash = pending;

            if (rec_ref.verification_level < LVL_DNS) {
                rec_ref.verification_level = LVL_DNS;
            };
        };

        rec_ref.updated_at_ms = now_ms;

        event::emit(VerificationEvent{
            event_id: b"approve_dns",
            credential_id: option::none(),
            issuer_id: option::some(issuer_id),
            action: ACT_UPGRADE_ISSUER,
            verification_method: VM_DNS,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: admin,
            note_hash: option::none(),
        });
    }

    /// Issuer request legal verification (level 2)
    public entry fun request_legal_verification(
        reg: &mut VerifyMeRegistry,
        issuer_id: u64,
        legal_doc_hash: vector<u8>,
        evidence_hash: Option<vector<u8>>,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let rec_ref = table::borrow_mut(&mut reg.issuers, issuer_id);
        assert!(rec_ref.issuer_address == sender, E_NOT_ISSUER_OWNER);
        assert!(rec_ref.status == ST_ACTIVE, E_ISSUER_NOT_ACTIVE);
        assert!(rec_ref.issuer_type == ISSUER_COOP, E_ISSUER_NOT_COOP);

        // Bạn muốn “tuần tự”: DNS trước legal
        assert!(rec_ref.verification_level >= LVL_DNS, E_LEVEL_TOO_LOW);

        rec_ref.pending_legal_doc_hash = option::some(legal_doc_hash);
        rec_ref.updated_at_ms = now_ms;

        event::emit(VerificationEvent{
            event_id: b"request_legal",
            credential_id: option::none(),
            issuer_id: option::some(issuer_id),
            action: ACT_UPGRADE_ISSUER,
            verification_method: VM_LEGAL,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: sender,
            note_hash: evidence_hash,
        });
    }

    /// Admin approve legal => level 2 + store legal_doc_hash
    public entry fun approve_legal(
        cap: &AdminCap,
        reg: &mut VerifyMeRegistry,
        issuer_id: u64,
        approve: bool,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        assert_admin(cap);
        let admin = tx_context::sender(ctx);

        let rec_ref = table::borrow_mut(&mut reg.issuers, issuer_id);
        assert!(rec_ref.status == ST_ACTIVE, E_ISSUER_NOT_ACTIVE);

        if (!approve) {
            rec_ref.pending_legal_doc_hash = option::none<vector<u8>>();
            rec_ref.updated_at_ms = now_ms;

            event::emit(VerificationEvent{
                event_id: b"approve_legal",
                credential_id: option::none(),
                issuer_id: option::some(issuer_id),
                action: ACT_UPGRADE_ISSUER,
                verification_method: VM_LEGAL,
                result: RES_FAIL,
                timestamp_ms: now_ms,
                actor: admin,
                note_hash: option::none(),
            });
            return;
        };

        let pending = rec_ref.pending_legal_doc_hash;
    rec_ref.pending_legal_doc_hash = option::none<vector<u8>>();

        if (option::is_some(&pending)) {
            let bind_ref = table::borrow_mut(&mut reg.issuer_bindings, issuer_id);
            bind_ref.legal_doc_hash = pending;

            if (rec_ref.verification_level < LVL_LEGAL) {
                rec_ref.verification_level = LVL_LEGAL;
            };
        };

        rec_ref.updated_at_ms = now_ms;

        event::emit(VerificationEvent{
            event_id: b"approve_legal",
            credential_id: option::none(),
            issuer_id: option::some(issuer_id),
            action: ACT_UPGRADE_ISSUER,
            verification_method: VM_LEGAL,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: admin,
            note_hash: option::none(),
        });
    }

    /***************
     * CREDENTIAL FLOWS
     ***************/
    /// COOP issuer phát hành credential.
    /// - Nếu user đã có ví: truyền owner_address = some(addr), cccd_hash = none
    /// - Nếu user chưa có: owner_address = none, cccd_hash = some(hash_cccd)
    public entry fun issue_credential_by_coop_issuer(
        reg: &mut VerifyMeRegistry,
        issuer_id: u64,
        credential_type: vector<u8>,
        owner_address: Option<address>,
        cccd_hash: Option<vector<u8>>,
        data_hash: vector<u8>,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let issuer = table::borrow(&reg.issuers, issuer_id);
        assert!(issuer.issuer_address == sender, E_NOT_ISSUER_OWNER);
        assert!(issuer.status == ST_ACTIVE, E_ISSUER_NOT_ACTIVE);
        assert!(issuer.issuer_type == ISSUER_COOP, E_ISSUER_NOT_COOP);
        assert!(issuer.verification_level >= LVL_DNS, E_LEVEL_TOO_LOW);

        // basic sanity: không được vừa có owner vừa có cccd
        if (option::is_some(&owner_address)) {
            assert!(!option::is_some(&cccd_hash), E_BAD_STATUS);
        } else {
            assert!(option::is_some(&cccd_hash), E_BAD_STATUS);
        };

        let credential_id = reg.next_credential_id;
        reg.next_credential_id = credential_id + 1;

        let cred = CredentialRecord {
            credential_id,
            issuer_id,
            credential_type,
            issued_at_ms: now_ms,
            status: CRED_ISSUED,
            owner_address,
            cccd_hash,
            data_hash,
        };

    table::add(&mut reg.credentials, credential_id, cred);

        event::emit(VerificationEvent{
            event_id: b"issue_cred",
            credential_id: option::some(credential_id),
            issuer_id: option::some(issuer_id),
            action: ACT_ISSUE,
            verification_method: VM_ONCHAIN,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: sender,
            note_hash: option::none(),
        });
    }

    /// Non-coop: ứng viên submit credential (PDF scan) – ban đầu “ISSUED” (chưa verified).
    /// issuer_id ở đây là NON_COOP issuer record (có thể level 0).
    public entry fun submit_credential_by_user_noncoop(
        reg: &mut VerifyMeRegistry,
        issuer_id: u64,
        credential_type: vector<u8>,
        owner_address: address,
        data_hash: vector<u8>,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(user == owner_address, E_BAD_STATUS);

    let issuer = table::borrow(&reg.issuers, issuer_id);
        assert!(issuer.issuer_type == ISSUER_NON_COOP, E_BAD_STATUS);

        let credential_id = reg.next_credential_id;
        reg.next_credential_id = credential_id + 1;

        let cred = CredentialRecord {
            credential_id,
            issuer_id,
            credential_type,
            issued_at_ms: now_ms,
            status: CRED_ISSUED,
            owner_address: option::some(owner_address),
            cccd_hash: option::none<vector<u8>>(),
            data_hash,
        };

        table::add(&mut reg.credentials, credential_id, cred);

        event::emit(VerificationEvent{
            event_id: b"submit_noncoop",
            credential_id: option::some(credential_id),
            issuer_id: option::some(issuer_id),
            action: ACT_ISSUE,
            verification_method: VM_EXTERNAL,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: user,
            note_hash: option::none(),
        });
    }

    /// Admin/oracle verify credential (EXTERNAL/LEGAL) => status = VERIFIED hoặc giữ nguyên + emit event
    public entry fun verify_credential_result(
        cap: &AdminCap,
        reg: &mut VerifyMeRegistry,
        credential_id: u64,
        verification_method: u8, // VM_EXTERNAL | VM_LEGAL
        success: bool,
        evidence_hash: Option<vector<u8>>,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        assert_admin(cap);
        let admin = tx_context::sender(ctx);

        let cred_ref = table::borrow_mut(&mut reg.credentials, credential_id);

        if (success) {
            // chỉ set verified nếu chưa bị revoke
            assert!(cred_ref.status != CRED_REVOKED, E_BAD_STATUS);
            cred_ref.status = CRED_VERIFIED;
        };

        event::emit(VerificationEvent{
            event_id: b"verify_cred",
            credential_id: option::some(credential_id),
            issuer_id: option::some(cred_ref.issuer_id),
            action: ACT_VERIFY,
            verification_method,
            result: if (success) { RES_SUCCESS } else { RES_FAIL },
            timestamp_ms: now_ms,
            actor: admin,
            note_hash: evidence_hash,
        });
    }

    /// Claim: user join platform, link CCCD hash, và claim credential đã issue bằng CCCD hash
    public entry fun claim_credential_by_cccd(
        reg: &mut VerifyMeRegistry,
        credential_id: u64,
        user_cccd_hash: vector<u8>,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        let cred_ref = table::borrow_mut(&mut reg.credentials, credential_id);

        // chưa claimed mới cho claim
        assert!(!option::is_some(&cred_ref.owner_address), E_ALREADY_CLAIMED);

        // phải có cccd_hash đã gắn
        assert!(option::is_some(&cred_ref.cccd_hash), E_BAD_STATUS);

        // so sánh hash
        let stored = option::extract(&mut cred_ref.cccd_hash);
        let stored_len = vector::length(&stored);
        let user_len = vector::length(&user_cccd_hash);
        assert!(stored_len == user_len, E_CCCD_MISMATCH);

        let mut i = 0;
        while (i < stored_len) {
            let a = *vector::borrow(&stored, i);
            let b = *vector::borrow(&user_cccd_hash, i);
            assert!(a == b, E_CCCD_MISMATCH);
            i = i + 1;
        };

        // claim: set owner, clear cccd_hash
        cred_ref.owner_address = option::some(user);
    cred_ref.cccd_hash = option::none<vector<u8>>();
        cred_ref.status = CRED_VERIFIED; // tuỳ bạn: claim có thể chỉ “ISSUED->ISSUED”, nhưng thường claim xong coi như verified linkage

        event::emit(VerificationEvent{
            event_id: b"claim_cred",
            credential_id: option::some(credential_id),
            issuer_id: option::some(cred_ref.issuer_id),
            action: ACT_CLAIM,
            verification_method: VM_ONCHAIN,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: user,
            note_hash: option::none(),
        });
    }

    /// Revoke credential: chỉ issuer owner hoặc admin (tuỳ design). Ở đây: issuer owner.
    public entry fun revoke_credential_by_issuer(
        reg: &mut VerifyMeRegistry,
        credential_id: u64,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let cred_ref = table::borrow_mut(&mut reg.credentials, credential_id);

        let issuer = table::borrow(&reg.issuers, cred_ref.issuer_id);
        assert!(issuer.issuer_address == sender, E_NOT_ISSUER_OWNER);

        cred_ref.status = CRED_REVOKED;

        event::emit(VerificationEvent{
            event_id: b"revoke_cred",
            credential_id: option::some(credential_id),
            issuer_id: option::some(cred_ref.issuer_id),
            action: ACT_REVOKE,
            verification_method: VM_ONCHAIN,
            result: RES_SUCCESS,
            timestamp_ms: now_ms,
            actor: sender,
            note_hash: option::none(),
        });
    }

    /***************
     * READ HELPERS (view)
     ***************/
    public fun get_issuer(reg: &VerifyMeRegistry, issuer_id: u64): &IssuerRecord {
        table::borrow(&reg.issuers, issuer_id)
    }

    public fun get_issuer_binding(reg: &VerifyMeRegistry, issuer_id: u64): &IssuerIdentityBinding {
        table::borrow(&reg.issuer_bindings, issuer_id)
    }

    public fun get_credential(reg: &VerifyMeRegistry, credential_id: u64): &CredentialRecord {
        table::borrow(&reg.credentials, credential_id)
    }
}
