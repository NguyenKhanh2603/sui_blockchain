import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Dropzone from "../../components/ui/Dropzone";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { issuerService } from "../../services/issuerService";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

function Compliance() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    issuerService.getComplianceFiles().then(setFiles);
  }, []);

  const handleUpload = async (list) => {
    for (const file of list) {
      const created = await issuerService.uploadComplianceFile(file.name);
      setFiles((prev) => [created, ...prev]);
      toast.success(`Uploaded ${file.name}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Compliance</p>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
      </div>
      <Dropzone onFiles={handleUpload} />
      <Card className="p-4">
        <Table
          columns={[
            { key: "name", header: "File" },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "danger"}>{r.status}</Badge> },
            { key: "uploadedAt", header: "Uploaded", render: (r) => formatDate(r.uploadedAt) },
          ]}
          data={files}
          emptyLabel="No files yet"
        />
      </Card>
      <Card className="p-4 border-dashed">
        <p className="text-sm font-semibold text-slate-700">Change history</p>
        <p className="text-xs text-slate-500">UI stub — track updates across uploads.</p>
      </Card>
    </div>
  );
}

export default Compliance;
