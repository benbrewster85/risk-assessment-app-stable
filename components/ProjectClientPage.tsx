"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { Project, RiskAssessmentListItem, DynamicRisk } from "@/lib/types";
import DynamicRiskLog from "./DynamicRiskLog";

type ProjectClientPageProps = {
  initialProject: Project;
  initialRiskAssessments: RiskAssessmentListItem[];
  initialDynamicRisks: DynamicRisk[];
  currentUserId: string;
  currentUserRole: string;
};

export default function ProjectClientPage({
  initialProject,
  initialRiskAssessments,
  initialDynamicRisks,
  currentUserId,
  currentUserRole,
}: ProjectClientPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [project] = useState(initialProject);
  const [riskAssessments, setRiskAssessments] = useState(
    initialRiskAssessments
  );
  const [dynamicRisks, setDynamicRisks] = useState(initialDynamicRisks);

  // State for the "Create RA" modal
  const [isRaModalOpen, setIsRaModalOpen] = useState(false);
  const [newRaName, setNewRaName] = useState("");
  const [newRaDescription, setNewRaDescription] = useState("");

  // State for the "Log Dynamic Risk" modal
  const [isDynamicRiskModalOpen, setIsDynamicRiskModalOpen] = useState(false);
  const [riskDescription, setRiskDescription] = useState("");
  const [personnelOnSite, setPersonnelOnSite] = useState("");
  const [controlsTaken, setControlsTaken] = useState("");
  const [safeToContinue, setSafeToContinue] = useState(true);
  const [riskStatus, setRiskStatus] = useState("Temporary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaName) {
      alert("Risk Assessment name is required.");
      return;
    }
    const { data: newRa, error } = await supabase
      .from("risk_assessments")
      .insert({
        project_id: project.id,
        name: newRaName,
        description: newRaDescription || null,
        team_id: project.team_id,
      })
      .select("id")
      .single();
    if (error) {
      alert(`Failed to create Risk Assessment: ${error.message}`);
    } else if (newRa) {
      router.push(`/dashboard/ra/${newRa.id}`);
    }
  };

  const handleLogDynamicRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: newDynamicRisk, error } = await supabase
      .from("dynamic_risks")
      .insert({
        project_id: project.id,
        team_id: project.team_id,
        logged_by_user_id: currentUserId,
        risk_description: riskDescription,
        personnel_on_site: personnelOnSite,
        control_measures_taken: controlsTaken,
        is_safe_to_continue: safeToContinue,
        risk_status: riskStatus,
      })
      .select("*, logged_by:profiles(first_name, last_name)")
      .single();

    if (error) {
      alert(`Error logging dynamic risk: ${error.message}`);
    } else if (newDynamicRisk) {
      const transformedRisk = {
        ...newDynamicRisk,
        logged_by: Array.isArray(newDynamicRisk.logged_by)
          ? newDynamicRisk.logged_by[0]
          : newDynamicRisk.logged_by,
      };
      setDynamicRisks([transformedRisk as DynamicRisk, ...dynamicRisks]);
      setIsDynamicRiskModalOpen(false);
      setRiskDescription("");
      setPersonnelOnSite("");
      setControlsTaken("");
    }
    setIsSubmitting(false);
  };

  if (!project) return <p className="p-8">Project not found.</p>;

  return (
    <>
      {/* The two modals have no changes */}
      <Modal
        title="Create New Risk Assessment"
        isOpen={isRaModalOpen}
        onClose={() => setIsRaModalOpen(false)}
      >
        <form onSubmit={handleCreateRa} className="space-y-4">
          <div>
            <label
              htmlFor="raName"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="raName"
              value={newRaName}
              onChange={(e) => setNewRaName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="raDesc"
              className="block text-sm font-medium text-gray-700"
            >
              Site & Risk Summary (Optional)
            </label>
            <textarea
              id="raDesc"
              value={newRaDescription}
              onChange={(e) => setNewRaDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g. This is a ballasted rail track..."
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsRaModalOpen(false)}
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        title="Log Dynamic Risk"
        isOpen={isDynamicRiskModalOpen}
        onClose={() => setIsDynamicRiskModalOpen(false)}
      >
        <form onSubmit={handleLogDynamicRisk} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Description of New Risk
            </label>
            <textarea
              value={riskDescription}
              onChange={(e) => setRiskDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Control Measures Taken
            </label>
            <textarea
              value={controlsTaken}
              onChange={(e) => setControlsTaken(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Personnel on Site
            </label>
            <input
              type="text"
              value={personnelOnSite}
              onChange={(e) => setPersonnelOnSite(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Is it safe to continue?
              </label>
              <select
                value={String(safeToContinue)}
                onChange={(e) => setSafeToContinue(e.target.value === "true")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Risk Status</label>
              <select
                value={riskStatus}
                onChange={(e) => setRiskStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option>Temporary</option>
                <option>Permanent</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsDynamicRiskModalOpen(false)}
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Logging..." : "Log Risk"}
            </button>
          </div>
        </form>
      </Modal>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Projects
            </Link>
            <span className="mx-2 text-gray-500">&gt;</span>
            <span className="text-gray-700">{project.name}</span>
          </div>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600">Ref: {project.reference || "N/A"}</p>
              {project.location_address && (
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                  <b>Address:</b> {project.location_address}
                </p>
              )}
              {project.location_what3words && (
                <p className="text-gray-600">
                  <b>what3words:</b> ///
                  {project.location_what3words.replace("///", "")}
                </p>
              )}
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <button
                onClick={() => setIsDynamicRiskModalOpen(true)}
                className="bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700"
              >
                Log Dynamic Risk
              </button>
              {currentUserRole === "team_admin" && (
                <button
                  onClick={() => setIsRaModalOpen(true)}
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  + New Risk Assessment
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Risk Assessments</h2>
            {riskAssessments.length > 0 ? (
              <div className="space-y-4">
                {riskAssessments.map((ra) => (
                  // UPDATED: Replaced <Link> with a clickable <div>
                  <div
                    key={ra.id}
                    onClick={() => router.push(`/dashboard/ra/${ra.id}`)}
                    className="block border p-4 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg text-blue-700">
                          {ra.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {ra.description}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(ra.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-700">
                  No risk assessments yet.
                </h3>
                <p className="text-gray-500 mt-2">
                  Get started by creating your first RA for this project.
                </p>
              </div>
            )}
          </div>

          <DynamicRiskLog risks={dynamicRisks} />
        </div>
      </div>
    </>
  );
}
