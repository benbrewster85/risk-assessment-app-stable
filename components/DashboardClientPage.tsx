"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Modal from "@/components/Modal";
import { ProjectListItem } from "@/lib/types";

// UPDATED: The component now receives the user's role
type DashboardClientPageProps = {
  initialProjects: ProjectListItem[];
  currentUserRole: string;
};

export default function DashboardClientPage({
  initialProjects,
  currentUserRole,
}: DashboardClientPageProps) {
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectReference, setNewProjectReference] = useState("");
  const [newProjectAddress, setNewProjectAddress] = useState("");
  const [newProjectW3W, setNewProjectW3W] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) {
      alert("Project name is required.");
      return;
    }

    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({
        name: newProjectName,
        reference: newProjectReference || null,
        location_address: newProjectAddress || null,
        location_what3words: newProjectW3W || null,
      })
      .select("id, name, reference, last_edited_at")
      .single();

    if (error) {
      alert(`Failed to create project: ${error.message}`);
    } else if (newProject) {
      setProjects([newProject, ...projects]);
      setNewProjectName("");
      setNewProjectReference("");
      setNewProjectAddress("");
      setNewProjectW3W("");
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <Modal
        title="Create New Project"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-gray-700"
            >
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="projectRef"
              className="block text-sm font-medium text-gray-700"
            >
              Reference (Optional)
            </label>
            <input
              type="text"
              id="projectRef"
              value={newProjectReference}
              onChange={(e) => setNewProjectReference(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="projectAddress"
              className="block text-sm font-medium text-gray-700"
            >
              Site Address (Optional)
            </label>
            <textarea
              id="projectAddress"
              value={newProjectAddress}
              onChange={(e) => setNewProjectAddress(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="projectW3W"
              className="block text-sm font-medium text-gray-700"
            >
              what3words Address (Optional)
            </label>
            <input
              type="text"
              id="projectW3W"
              value={newProjectW3W}
              onChange={(e) => setNewProjectW3W(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g. ///filled.count.soap"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-2 py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
            {/* UPDATED: This button is now only rendered if the user is a team_admin */}
            {currentUserRole === "team_admin" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Project
              </button>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link
                    href={`/dashboard/project/${project.id}`}
                    key={project.id}
                    className="block border p-4 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <h3 className="font-bold text-xl mb-2">{project.name}</h3>
                    <p className="text-gray-600 text-sm">
                      Ref: {project.reference || "N/A"}
                    </p>
                    <p className="text-gray-500 text-xs mt-4">
                      Last edited:{" "}
                      {new Date(project.last_edited_at).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-700">
                  No projects yet.
                </h3>
                <p className="text-gray-500 mt-2">
                  Get started by creating your first project.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
