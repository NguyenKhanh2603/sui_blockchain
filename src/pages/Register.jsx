import React, { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { blockchainService } from "../services/blockchainService";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "../constants/blockchain";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Building2, User2, BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Register() {
  const { user, login } = useAuth();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegisterIssuer = async (type) => {
    if (!user?.walletAddress) return;
    setLoading(true);

    try {
      const typeVal = type === "NON_COOP" ? 2 : 1;
      const tx = new Transaction();
      tx.moveCall({
         target: `${PACKAGE_ID}::${MODULE_NAME}::register_issuer`,
         arguments: [
           tx.object(REGISTRY_ID),
           tx.pure.u8(typeVal),
           tx.pure.u64(Date.now()),
         ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log("Registration API Success:", result);
            toast.success("Registered successfully! Logging in...");
            
            // Wait a moment for chain indexing then force login
            setTimeout(async () => {
                 await login("issuer", { walletAddress: user.walletAddress }, { useDefaults: false });
                 navigate("/issuer/status");
            }, 3000);
          },
          onError: (err) => {
            console.error("Tx Failed:", err);
            toast.error("Registration failed: " + err.message);
            setLoading(false);
          },
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Error building transaction");
      setLoading(false);
    }
  };

  const roles = [
    {
      id: "issuer",
      label: "Register as Issuer",
      desc: "For universities, companies, and organizations that issue credentials.",
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      action: () => handleRegisterIssuer("COOP"), // Default to COOP for now
    },
    {
      id: "candidate",
      label: "Register as Candidate",
      desc: "For individuals who want to store and share their credentials.",
      icon: <User2 className="h-8 w-8 text-green-600" />,
      action: () => toast("Candidate registration is auto-handled via Vault"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to VerifyMe</h1>
            <p className="mt-2 text-gray-600">
                Your wallet <span className="font-mono bg-gray-200 px-2 py-1 rounded">{user?.walletAddress}</span> is not registered yet.
            </p>
            <p className="text-gray-500">Please choose a role to continue.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {roles.map((role) => (
                <Card key={role.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={role.action}>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-blue-50 rounded-full">
                            {role.icon}
                        </div>
                        <h3 className="text-xl font-semibold">{role.label}</h3>
                        <p className="text-gray-500">{role.desc}</p>
                        <Button className="w-full" disabled={loading}>
                            {loading ? "Processing..." : "Register Now"}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Register;
