import React, { useMemo, useState } from "react";

const candidateSeed = [
  {
    id: 1,
    name: "Ho Khanh",
    role: "Product Designer",
    credentials: 6,
    trust: 98,
    updated: "2h",
    status: "verified"
  },
  {
    id: 2,
    name: "Minh Le",
    role: "Blockchain Engineer",
    credentials: 4,
    trust: 85,
    updated: "1d",
    status: "pending"
  },
  {
    id: 3,
    name: "Tram Anh",
    role: "Data Analyst",
    credentials: 2,
    trust: 61,
    updated: "3d",
    status: "locked"
  },
  {
    id: 4,
    name: "Quang Duy",
    role: "Growth Lead",
    credentials: 7,
    trust: 92,
    updated: "4h",
    status: "verified"
  }
];

const credentialSeed = [
  {
    id: "ielts",
    title: "IELTS 8.0",
    issuer: "British Council",
    date: "12/05/2026",
    hash: "0x8abf...c22",
    status: "Valid",
    verified: true
  },
  {
    id: "degree",
    title: "Bachelor of Design",
    issuer: "RMIT University",
    date: "01/09/2024",
    hash: "0x14ad...77e",
    status: "Valid",
    verified: true
  },
  {
    id: "ux",
    title: "UX Research Specialization",
    issuer: "Coursera",
    date: "22/11/2025",
    hash: "0x77aa...110",
    status: "Revoked",
    verified: true
  }
];

const selfClaimedSeed = [
  {
    id: "leadership",
    title: "Team Leadership",
    detail: "Led a 6-person product squad in 2025"
  },
  {
    id: "sprint",
    title: "Product Sprint Facilitator",
    detail: "Ran 8 cross-functional design sprints"
  },
  {
    id: "speaking",
    title: "Public Speaking",
    detail: "Talked at 3 web3 design meetups"
  }
];

const lockStates = {
  locked: "Locked",
  pending: "Pending Approval",
  unlocked: "Unlocked"
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [walletInput, setWalletInput] = useState("");
  const [activeTab, setActiveTab] = useState("verified");
  const [modalData, setModalData] = useState(null);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [lockStatus, setLockStatus] = useState("locked");
  const [accessDuration, setAccessDuration] = useState("24h");

  const walletValid = useMemo(() => /^0x[a-fA-F0-9]{6,}$/.test(walletInput.trim()), [walletInput]);

  const filteredCandidates = useMemo(() => {
    if (statusFilter === "all") return candidateSeed;
    return candidateSeed.filter((candidate) => candidate.status === statusFilter);
  }, [statusFilter]);

  const openVerifyModal = (credential) => {
    setModalData(credential);
  };

  const closeVerifyModal = () => {
    setModalData(null);
  };

  const submitAccessRequest = (event) => {
    event.preventDefault();
    setLockStatus("pending");
    setAccessModalOpen(false);
  };

  const unlockAccess = () => {
    setLockStatus("unlocked");
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">SV</div>
          <div>
            <p className="brand-title">Congsat Vault</p>
            <p className="brand-sub">Cong kiem soat ung vien</p>
          </div>
        </div>
        <nav className="topbar-nav">
          <button
            className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-link ${activePage === "profile" ? "active" : ""}`}
            onClick={() => setActivePage("profile")}
          >
            Candidate Profile
          </button>
        </nav>
      </header>

      {activePage === "dashboard" && (
        <main>
          <section className="hero">
            <div>
              <h1>Cong kiem soat ung vien</h1>
              <p className="lead">Tra cuu nhanh ho so on-chain va tinh trang tin cay cua ung vien.</p>
            </div>
            <div className="trust-box">
              <p className="trust-label">Network Health</p>
              <p className="trust-score">99.2%</p>
              <p className="trust-note">0 revoked trong 30 ngay</p>
            </div>
          </section>

          <section className="search-panel">
            <label className="search-label" htmlFor="searchInput">
              Nhap dia chi vi hoac link ho so
            </label>
            <div className="search-row">
              <div className="search-input-wrap">
                <input
                  id="searchInput"
                  className="search-input"
                  placeholder="0x... hoac https://"
                  value={walletInput}
                  onChange={(event) => setWalletInput(event.target.value)}
                />
                {walletValid && (
                  <div className="search-valid" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M6 12l4 4 8-9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <button className="primary-btn">Tra cuu</button>
            </div>
            <p className="search-hint">He thong tu kiem tra dinh dang vi Sui (0x...)</p>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Ung vien gan day</h2>
                <p className="panel-sub">Cap nhat tu he thong xac thuc tren chuoi</p>
              </div>
              <div className="panel-actions">
                <div className="filter-group">
                  {[
                    { id: "all", label: "Tat ca" },
                    { id: "verified", label: "Da xac thuc" },
                    { id: "pending", label: "Can xem xet" },
                    { id: "locked", label: "Chua du quyen" }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      className={`pill ${statusFilter === filter.id ? "active" : ""}`}
                      onClick={() => setStatusFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="view-toggle">
                  <button
                    className={`ghost-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    Card
                  </button>
                  <button
                    className={`ghost-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            <div className={`candidate-list ${viewMode}`}>
              {filteredCandidates.map((candidate) => (
                <button
                  key={candidate.id}
                  className={`candidate-card ${candidate.status === "locked" ? "locked" : ""}`}
                  onClick={() => setActivePage("profile")}
                  type="button"
                >
                  <div className="card-header">
                    <div className="avatar">{candidate.name.split(" ").map((part) => part[0]).join("")}</div>
                    <span className={`status-chip ${candidate.status}`}>{
                      candidate.status === "verified"
                        ? "Da xac thuc"
                        : candidate.status === "pending"
                        ? "Can xem xet"
                        : "Chua du quyen"
                    }</span>
                  </div>
                  <h3>{candidate.name}</h3>
                  <p className="card-sub">{candidate.role} - {candidate.credentials} credentials</p>
                  <div className="card-meta">
                    <span>Trust Score {candidate.trust}%</span>
                    <span>Last update {candidate.updated}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}

      {activePage === "profile" && (
        <main>
          <section className="profile-hero">
            <div className="profile-left">
              <div className="avatar-lg">HK</div>
              <div>
                <h1>Ho Khanh</h1>
                <p className="lead">Product Designer with a focus on on-chain identity and trust.</p>
                <div className="profile-meta">
                  <span>Wallet 0x4be1...91d</span>
                  <span>Ho Chi Minh City</span>
                </div>
              </div>
            </div>
            <div className="profile-score">
              <p className="trust-label">Trust Score</p>
              <p className="trust-score">100% verified</p>
              <p className="trust-note">6 of 6 credentials on-chain</p>
            </div>
          </section>

          <section className="panel">
            <div className="tabs">
              <button className={`tab ${activeTab === "verified" ? "active" : ""}`} onClick={() => setActiveTab("verified")}>
                Verified Credentials
              </button>
              <button className={`tab ${activeTab === "self" ? "active" : ""}`} onClick={() => setActiveTab("self")}>
                Self-Claimed
              </button>
            </div>

            {activeTab === "verified" && (
              <div className="badge-grid">
                {credentialSeed.map((credential) => (
                  <button
                    key={credential.id}
                    className="credential-card"
                    onClick={() => openVerifyModal(credential)}
                  >
                    <div className="card-top">
                      <span className="badge-title">{credential.title}</span>
                      <span
                        className="verify-icon"
                        data-tooltip={`Verified by ${credential.issuer} (0x...abc)`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M12 3l7 4v5c0 4.4-2.9 8.5-7 10-4.1-1.5-7-5.6-7-10V7l7-4z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M8 12l3 3 5-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                    <p className="card-sub">Issued by {credential.issuer}</p>
                    <span className={`status-chip ${credential.status === "Valid" ? "verified" : "revoked"}`}>
                      {credential.status}
                    </span>
                  </button>
                ))}

                <div className="credential-card locked-item">
                  <div className="card-top">
                    <span className="badge-title">Bang diem dai hoc</span>
                    <span className="lock-icon">Lock</span>
                  </div>
                  <p className="card-sub">Chi tiet hoc phan va diem so</p>
                  {lockStatus === "locked" && (
                    <button className="ghost-btn request-access" onClick={() => setAccessModalOpen(true)}>
                      Request Access
                    </button>
                  )}
                  {lockStatus === "pending" && (
                    <div className="locked-actions">
                      <span className="locked-note">Dang cho ung vien duyet.</span>
                      <button className="primary-btn" onClick={unlockAccess} type="button">
                        Mark Unlocked
                      </button>
                    </div>
                  )}
                  {lockStatus === "unlocked" && <span className="unlock-note">Da duoc cap quyen xem.</span>}
                  <span className={`status-chip ${lockStatus}`}>{lockStates[lockStatus]}</span>
                </div>
              </div>
            )}

            {activeTab === "self" && (
              <div className="badge-grid">
                {selfClaimedSeed.map((item) => (
                  <div className="credential-card self-claimed" key={item.id}>
                    <div className="card-top">
                      <span className="badge-title">{item.title}</span>
                      <span className="status-chip pending">Unverified</span>
                    </div>
                    <p className="card-sub">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {modalData && (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={closeVerifyModal} />
          <div className="modal-card">
            <div className="modal-header">
              <h3>Verification Proof</h3>
              <button className="ghost-btn" onClick={closeVerifyModal}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <span>Issuer</span>
                <strong>{modalData.issuer}</strong>
              </div>
              <div className="modal-row">
                <span>Date Issued</span>
                <strong>{modalData.date}</strong>
              </div>
              <div className="modal-row">
                <span>Transaction Hash</span>
                <a
                  href="https://suiexplorer.com/txblock/0x..."
                  target="_blank"
                  rel="noreferrer"
                >
                  {modalData.hash}
                </a>
              </div>
              <div className="modal-row">
                <span>Status</span>
                <strong>{modalData.status}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {accessModalOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={() => setAccessModalOpen(false)} />
          <div className="modal-card">
            <div className="modal-header">
              <h3>Request Access</h3>
              <button className="ghost-btn" onClick={() => setAccessModalOpen(false)}>
                Close
              </button>
            </div>
            <form className="modal-body" onSubmit={submitAccessRequest}>
              <label className="search-label" htmlFor="accessDuration">Thoi gian muon xem</label>
              <select
                id="accessDuration"
                className="select"
                value={accessDuration}
                onChange={(event) => setAccessDuration(event.target.value)}
              >
                <option value="24h">Toi can xem trong 24h</option>
                <option value="3d">Toi can xem trong 3 ngay</option>
                <option value="7d">Toi can xem trong 7 ngay</option>
              </select>
              <button className="primary-btn" type="submit">Gui yeu cau</button>
              <p className="search-hint">Trang thai se chuyen sang Pending Approval.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
