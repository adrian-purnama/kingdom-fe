import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { DataTable } from "../../components/DataTable.jsx";
import { Modal } from "../../components/Modal.jsx";
import { useUser } from "../../context/UserContext.jsx";
import { CreateStudentForm } from "../../forms/CreateStudentForm.jsx";
import { EditStudentForm } from "../../forms/EditStudentForm.jsx";
import {
  apiDelete,
  apiGet,
  apiPostFormData,
  paths,
} from "../../lib/api.js";

const STUDENTS_PAGE_SIZE = 10;

const HOUSING_LABELS = {
  scientia: "Scientia",
  clipa: "Clipa",
  venture: "Venture",
};

export function AdminStudentsPage() {
  const { isAuthenticated, isAdmin, sessionLoading } = useUser();
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const csvInputRef = useRef(null);

  const loadStudents = useCallback(async (nextPage, nextQuery) => {
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams({
        page: String(nextPage),
        limit: String(STUDENTS_PAGE_SIZE),
      });
      if (nextQuery.trim()) {
        qs.set("search", nextQuery.trim());
      }
      const res = await apiGet(`${paths.adminStudents}?${qs.toString()}`);
      const data = res?.data ?? {};
      setRows(data.students ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? nextPage);
    } catch (e) {
      setErr(e?.message ?? "Failed to load students");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents(1, query);
  }, [loadStudents, query]);

  async function handleDelete(row) {
    const ok = window.confirm(
      `Delete student ${row.name} (NIM ${row.nim})? This cannot be undone.`,
    );
    if (!ok) return;
    setErr("");
    setDeletingId(row.id);
    try {
      await apiDelete(`${paths.adminStudents}/${row.id}`);
      await loadStudents(page, query);
    } catch (e) {
      setErr(e?.message ?? "Failed to delete student");
    } finally {
      setDeletingId("");
    }
  }

  async function handleCsvUpload(e) {
    e.preventDefault();
    const input = csvInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setErr("Choose a CSV file first");
      return;
    }
    setErr("");
    setCsvUploading(true);
    setImportResult(null);
    try {
      // Snapshot bytes so Chromium does not abort with ERR_UPLOAD_FILE_CHANGED
      // when React re-renders or the file input changes during upload.
      const bytes = await file.arrayBuffer();
      const snapshot = new File([bytes], file.name, {
        type: file.type || "text/csv",
      });
      const form = new FormData();
      form.append("file", snapshot);
      const res = await apiPostFormData(paths.adminStudentsImportCsv, form);
      const data = res?.data ?? {};
      setImportResult(data);
      setCsvFile(null);
      if (input) {
        input.value = "";
      }
      await loadStudents(1, query);
      setPage(1);
    } catch (uploadErr) {
      setErr(uploadErr?.message ?? "CSV import failed");
    } finally {
      setCsvUploading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (row) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {row.name}
          </span>
        ),
      },
      {
        id: "nim",
        header: "NIM",
        cell: (row) => (
          <span className="font-mono text-xs text-zinc-800 dark:text-zinc-100">
            {row.nim}
          </span>
        ),
      },
      {
        id: "point",
        header: "Point",
        align: "center",
        className: "tabular-nums",
        cell: (row) => row.point ?? 0,
      },
      {
        id: "housing",
        header: "Housing",
        cell: (row) => (
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {HOUSING_LABELS[row.housing] ?? row.housing}
          </span>
        ),
      },
    ],
    [],
  );

  if (sessionLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading session…</p>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full">
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          to="/admin"
          className="text-primary underline-offset-2 hover:underline"
        >
          ← Admin dashboard
        </Link>
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Students
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Manage students: create, edit, search, delete, or import from CSV.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Add student
        </button>
      </div>

      <section className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Import CSV
        </h2>
        <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
          Required columns:{" "}
          <code className="font-mono">name, nim, point, housing</code>
          . Housing must be scientia, clipa, or venture. Existing NIMs are updated.
        </p>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={handleCsvUpload}
        >
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={csvUploading}
            onChange={(ev) => setCsvFile(ev.target.files?.[0] ?? null)}
            className="max-w-xs text-sm text-zinc-700 file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:opacity-50 dark:text-zinc-300"
          />
          <button
            type="submit"
            disabled={csvUploading || !csvFile}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-white disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {csvUploading ? "Uploading…" : "Upload CSV"}
          </button>
        </form>
        {importResult ? (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <p>
              Created: {importResult.created ?? 0}, updated:{" "}
              {importResult.updated ?? 0}, failed: {importResult.failed ?? 0}
            </p>
            {(importResult.errors ?? []).length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-xs">
                {(importResult.errors ?? []).slice(0, 10).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <form
        className="mb-4 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(searchInput.trim());
          setPage(1);
        }}
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name or NIM…"
          className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Search
        </button>
        {query ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setQuery("");
              setPage(1);
            }}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Clear
          </button>
        ) : null}
      </form>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        loading={loading}
        error={err || null}
        emptyMessage="No students found."
        actions={(row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditStudent(row)}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Edit…
            </button>
            <button
              type="button"
              disabled={deletingId === row.id}
              onClick={() => handleDelete(row)}
              className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
            >
              {deletingId === row.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
        pagination={{
          page,
          pageSize: STUDENTS_PAGE_SIZE,
          total,
          onPageChange: (nextPage) => {
            setPage(nextPage);
            loadStudents(nextPage, query);
          },
        }}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add student"
      >
        <CreateStudentForm
          onSuccess={async () => {
            setCreateOpen(false);
            await loadStudents(1, query);
            setPage(1);
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editStudent != null}
        onClose={() => setEditStudent(null)}
        title="Edit student"
      >
        {editStudent ? (
          <EditStudentForm
            key={editStudent.id}
            student={editStudent}
            onSuccess={async () => {
              setEditStudent(null);
              await loadStudents(page, query);
            }}
            onCancel={() => setEditStudent(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
