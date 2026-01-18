import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";
import Card from "../components/ui/Card";
import {
    Building2,
    User2,
    BadgeCheck,
    ShieldCheck,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import toast from "react-hot-toast";

const roles = [
    {
        value: "candidate",
        label: "Candidate",
        desc: "Manage your vault and share proofs privately.",
        icon: <User2 className="h-5 w-5" />,
    },
    {
        value: "recruiter",
        label: "Recruiter",
        desc: "Review candidates with verified credentials.",
        icon: <BadgeCheck className="h-5 w-5" />,
    },
    {
        value: "issuer",
        label: "Issuer",
        desc: "Issue and revoke verification records.",
        icon: <Building2 className="h-5 w-5" />,
    },
];

const redirectMap = {
    candidate: "/candidate/vault",
    recruiter: "/recruiter/dashboard",
    issuer: "/issuer/status",
};

function Landing() {
    const [tab, setTab] = useState("login");
    const [role, setRole] = useState("candidate");
    const [form, setForm] = useState({
        username: "",
        email: "",
        dob: "",
        mobile: "",
        password: "",
        cccd: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { login, user } = useAuth();

    // Redirect if logged in
    React.useEffect(() => {
        if (user) {
            // Check registration status if available
            if (user.isRegistered === false) {
                 navigate("/register");
            } else {
                 navigate(redirectMap[user.role || "issuer"]);
            }
        }
    }, [user, navigate]);

    const getStoredNameForEmail = (email) => {
        if (!email) return "";
        try {
            const stored = JSON.parse(localStorage.getItem("verifyme_user"));
            if (stored?.email === email && stored?.name) return stored.name;
        } catch (err) {
            return "";
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {};
        const trimmedEmail = form.email?.trim();
        const trimmedUsername = form.username?.trim();
        const trimmedMobile = form.mobile?.trim();
        const isCandidate = role === "candidate";

        if (tab === "login") {
            if (!trimmedEmail) nextErrors.email = "Email is required";
            if (!form.password) nextErrors.password = "Password is required";
        } else {
            if (!trimmedUsername) nextErrors.username = "Username is required";
            if (!trimmedEmail) nextErrors.email = "Email is required";
            if (!trimmedMobile) {
                nextErrors.mobile = "Mobile number is required";
            } else {
                const mobileDigits = trimmedMobile.replace(/\D/g, "");
                if (mobileDigits.length < 8) {
                    nextErrors.mobile = "Mobile number looks too short";
                }
            }
            if (isCandidate && !form.dob) {
                nextErrors.dob = "Date of birth is required";
            }
            if (isCandidate && !form.cccd?.trim()) {
                nextErrors.cccd = "National ID (CCCD) is required";
            }
            if (!form.password) nextErrors.password = "Password is required";
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setLoading(true);
        try {
            // NOTE: Mock login (Email/Pass) is disabled for production chain validation.
            // Users should use Wallet Connection via the header button to login properly.
            if (tab === "login") {
                 // Warn user to use Wallet
                 toast("Please connect your Wallet to login securely.", { icon: "🔒" });
                 // OPTIONAL: Still allow mock for demo if needed, but the user asked to fix the 'unregistered login' issue.
                 // We will block explicit mock login for consistency with the prompt.
                 setLoading(false);
                 return;
            } else {
                // ... registration form ...
                // This is also a mock registration (local storage).
                // Real registration happens inside the dashboard via blockchain transaction.
                toast("Please connect your Wallet to create an account on-chain.", { icon: "🔗" });
                setLoading(false);
                return;
            }
        } catch (err) {
            toast.error("Sign-in failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f4f7ff] via-white to-[#e8edff]">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-navy-100 blur-3xl" />
                <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-navy-200/60 blur-3xl" />
            </div>
            <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:py-16">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-500 to-navy-700 text-white font-bold">
                            V
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500">
                                Verify Me
                            </p>
                            <p className="text-lg font-bold text-slate-900">
                                Identity made trustable
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-navy-500" />
                        Private-by-default
                    </div>
                    <div className="md:ml-4">
                        <ConnectButton />
                    </div>
                </header>

                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy-700 shadow-sm">
                            <Sparkles className="h-4 w-4" /> Verify once, reuse
                            anywhere.
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
                            Verify Me
                        </h1>
                        <p className="text-2xl md:text-2xl font-black text-slate-900 leading-tight">
                            Simple verification for candidates, recruiters, and
                            issuers.
                        </p>
                        <p className="text-lg text-slate-600">
                            Keep credentials safe, share with controls, and
                            review candidates with confidence. No crypto jargon,
                            just clean verification records.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-12">
                            <Card className="p-4">
                                <p className="text-sm font-semibold text-slate-500">
                                    Candidates
                                </p>
                                <p className="mt-2 text-xl font-bold text-slate-900">
                                    Private Vault
                                </p>
                                <p className="text-sm text-slate-500">
                                    Lock sensitive items, share proofs only when
                                    needed.
                                </p>
                            </Card>
                            <Card className="p-4">
                                <p className="text-sm font-semibold text-slate-500">
                                    Recruiters & Issuers
                                </p>
                                <p className="mt-2 text-xl font-bold text-slate-900">
                                    Frictionless reviews
                                </p>
                                <p className="text-sm text-slate-500">
                                    Inbox for access + issuance with audit-ready
                                    history.
                                </p>
                            </Card>
                        </div>
                    </div>

                    <Card className="p-6 shadow-soft relative overflow-hidden">
                        {/* <div className="absolute right-6 top-6 rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700">
                            Web2 sign-in
                        </div> */}
                        <div className="space-y-6">
                            <Tabs
                                tabs={[
                                    { value: "login", label: "Login" },
                                    { value: "signup", label: "Sign up" },
                                ]}
                                activeTab={tab}
                                onChange={setTab}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {roles.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => {
                                            setRole(r.value);
                                            if (r.value !== "candidate") {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    cccd: "",
                                                }));
                                            }
                                        }}
                                        className={`rounded-xl border px-3 py-3 text-left transition hover:border-navy-200 ${
                                            role === r.value
                                                ? "border-navy-400 bg-navy-50 shadow-sm"
                                                : "border-slate-200 bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-white p-2 text-navy-600 shadow-sm">
                                                {r.icon}
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {r.label}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {r.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {tab === "signup" && (
                                    <Input
                                        label="Username"
                                        required
                                        value={form.username}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                username: e.target.value,
                                            })
                                        }
                                        placeholder="Enter your username"
                                        error={errors.username}
                                    />
                                )}
                                <Input
                                    label="Email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your email"
                                    error={errors.email}
                                />
                                {tab === "signup" && role === "candidate" && (
                                    <Input
                                        label="DOB"
                                        type="date"
                                        required
                                        value={form.dob}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                dob: e.target.value,
                                            })
                                        }
                                        error={errors.dob}
                                    />
                                )}
                                {tab === "signup" && (
                                    <Input
                                        label="Mobile number"
                                        type="tel"
                                        required
                                        value={form.mobile}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                mobile: e.target.value,
                                            })
                                        }
                                        placeholder="Enter your mobile number"
                                        error={errors.mobile}
                                    />
                                )}
                                {tab === "signup" && role === "candidate" && (
                                    <Input
                                        label="National ID (CCCD)"
                                        required
                                        value={form.cccd}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                cccd: e.target.value,
                                            })
                                        }
                                        placeholder="Enter your CCCD number"
                                        error={errors.cccd}
                                    />
                                )}
                                <Input
                                    label="Password"
                                    type="password"
                                    required
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your password"
                                    error={errors.password}
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="w-full justify-center"
                                    >
                                        Continue with Google
                                    </Button>
                                </div>
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="w-full justify-center"
                                    icon={<ArrowRight className="h-4 w-4" />}
                                >
                                    Continue
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-center"
                                    onClick={async () => {
                                        await login(
                                            "admin",
                                            {
                                                username: "Admin",
                                                name: "Admin",
                                                email: "admin@verifyme.test",
                                            },
                                            { useDefaults: false }
                                        );
                                        toast.success("Admin login");
                                        navigate("/admin/reviews");
                                    }}
                                >
                                    Continue as an Admin
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Landing;
