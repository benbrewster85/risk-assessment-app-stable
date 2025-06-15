"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "./Modal";
import { RaEntry } from "@/lib/types";

type Hazard = { id: string; name: string };
type Risk = { id: string; name: string };

type AddRaEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  raId: string;
  teamId: string;
  onSuccess: (resultEntry: RaEntry) => void;
  entryToEdit: RaEntry | null;
};

const CREATE_NEW_ID = "CREATE_NEW";

export default function AddRaEntryModal({
  isOpen,
  onClose,
  raId,
  teamId,
  onSuccess,
  entryToEdit,
}: AddRaEntryModalProps) {
  const supabase = createClient();
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [selectedHazardId, setSelectedHazardId] = useState("");
  const [selectedRiskId, setSelectedRiskId] = useState("");
  const [newHazardName, setNewHazardName] = useState("");
  const [newRiskName, setNewRiskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [personAffected, setPersonAffected] = useState("Operative");
  const [initialLikelihood, setInitialLikelihood] = useState(3);
  const [initialImpact, setInitialImpact] = useState(3);
  const [controlMeasures, setControlMeasures] = useState("");
  const [resultantLikelihood, setResultantLikelihood] = useState(1);
  const [resultantImpact, setResultantImpact] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = entryToEdit !== null;

  useEffect(() => {
    if (entryToEdit && isEditing) {
      setTaskDescription(entryToEdit.task_description || "");
      setSelectedHazardId(entryToEdit.hazard_id || "");
      setSelectedRiskId(entryToEdit.risk_id || "");
      setPersonAffected(entryToEdit.person_affected || "Operative");
      setInitialLikelihood(entryToEdit.initial_likelihood);
      setInitialImpact(entryToEdit.initial_impact);
      setControlMeasures(entryToEdit.control_measures || "");
      setResultantLikelihood(entryToEdit.resultant_likelihood);
      setResultantImpact(entryToEdit.resultant_impact);
    }
  }, [entryToEdit, isEditing]);

  const resetForm = useCallback(() => {
    setSelectedHazardId("");
    setSelectedRiskId("");
    setNewHazardName("");
    setNewRiskName("");
    setTaskDescription("");
    setPersonAffected("Operative");
    setInitialLikelihood(3);
    setInitialImpact(3);
    setControlMeasures("");
    setResultantLikelihood(1);
    setResultantImpact(1);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchHazards = async () => {
        const { data } = await supabase
          .from("hazards")
          .select("id, name")
          .order("name");
        if (data) setHazards(data);
      };
      fetchHazards();
    } else {
      resetForm();
    }
  }, [isOpen, supabase, resetForm]);

  useEffect(() => {
    setRisks([]);
    if (!isEditing || selectedHazardId !== entryToEdit?.hazard_id) {
      setSelectedRiskId("");
    }
    if (selectedHazardId && selectedHazardId !== CREATE_NEW_ID) {
      const fetchRisks = async () => {
        const { data, error } = await supabase
          .from("risks")
          .select("id, name, hazard_risks!inner(hazard_id)")
          .eq("hazard_risks.hazard_id", selectedHazardId)
          .order("name");
        if (error) console.error("Error fetching risks", error);
        else setRisks(data || []);
      };
      fetchRisks();
    }
  }, [selectedHazardId, supabase, isEditing, entryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalHazardId = selectedHazardId;
      if (selectedHazardId === CREATE_NEW_ID) {
        if (!newHazardName) throw new Error("New hazard name cannot be empty.");
        const { data, error } = await supabase.rpc(
          "create_hazard_if_not_exists",
          { hazard_name: newHazardName, p_team_id: teamId }
        );
        if (error) throw error;
        finalHazardId = data;
      }
      let finalRiskId = selectedRiskId;
      if (selectedRiskId === CREATE_NEW_ID) {
        if (!newRiskName) throw new Error("New risk name cannot be empty.");
        const { data, error } = await supabase.rpc("create_risk_and_link", {
          risk_name: newRiskName,
          p_hazard_id: finalHazardId,
          p_team_id: teamId,
        });
        if (error) throw error;
        finalRiskId = data;
      }

      if (!finalHazardId || !finalRiskId) {
        throw new Error("A hazard and a risk must be selected or created.");
      }

      const entryData = {
        ra_id: raId,
        task_description: taskDescription,
        hazard_id: finalHazardId,
        risk_id: finalRiskId,
        person_affected: personAffected,
        initial_likelihood: initialLikelihood,
        initial_impact: initialImpact,
        control_measures: controlMeasures,
        resultant_likelihood: resultantLikelihood,
        resultant_impact: resultantImpact,
      };

      let resultEntry;
      let resultError;

      if (isEditing) {
        const { data, error } = await supabase
          .from("ra_entries")
          .update(entryData)
          .eq("id", entryToEdit.id)
          .select("*, hazard:hazards(name), risk:risks(name)")
          .single();
        resultEntry = data;
        resultError = error;
      } else {
        const { data, error } = await supabase
          .from("ra_entries")
          .insert(entryData)
          .select("*, hazard:hazards(name), risk:risks(name)")
          .single();
        resultEntry = data;
        resultError = error;
      }

      if (resultError) throw resultError;

      onSuccess(resultEntry);
      onClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreOptions = [1, 2, 3, 4, 5];

  return (
    <Modal
      title={
        isEditing
          ? "Edit Risk Assessment Entry"
          : "Add New Risk Assessment Entry"
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[80vh] overflow-y-auto p-1"
      >
        {/* Form JSX */}
        <div>
          <label>Activity / Task</label>
          <input
            type="text"
            placeholder="e.g., Installing ground survey control"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label>Hazard</label>
          <select
            value={selectedHazardId}
            onChange={(e) => setSelectedHazardId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          >
            <option value="" disabled>
              Select a hazard...
            </option>
            <option value={CREATE_NEW_ID}>-- Add New Hazard --</option>
            {hazards.map((hazard) => (
              <option key={hazard.id} value={hazard.id}>
                {hazard.name}
              </option>
            ))}
          </select>
          {selectedHazardId === CREATE_NEW_ID && (
            <input
              type="text"
              placeholder="Enter new hazard name"
              value={newHazardName}
              onChange={(e) => setNewHazardName(e.target.value)}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"
            />
          )}
        </div>
        {selectedHazardId && (
          <div>
            <label>Risk</label>
            <select
              value={selectedRiskId}
              onChange={(e) => setSelectedRiskId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="" disabled>
                Select a risk...
              </option>
              <option value={CREATE_NEW_ID}>-- Add New Risk --</option>
              {risks.map((risk) => (
                <option key={risk.id} value={risk.id}>
                  {risk.name}
                </option>
              ))}
            </select>
            {selectedRiskId === CREATE_NEW_ID && (
              <input
                type="text"
                placeholder="Enter new risk name"
                value={newRiskName}
                onChange={(e) => setNewRiskName(e.target.value)}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"
              />
            )}
          </div>
        )}
        <div>
          <label>Person Affected</label>
          <input
            type="text"
            value={personAffected}
            onChange={(e) => setPersonAffected(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="block text-sm font-bold text-gray-700 col-span-3">
            Initial Assessment
          </label>
          <div>
            <label>Likelihood (1-5)</label>
            <select
              value={initialLikelihood}
              onChange={(e) => setInitialLikelihood(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {scoreOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Impact (1-5)</label>
            <select
              value={initialImpact}
              onChange={(e) => setInitialImpact(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {scoreOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label>Risk</label>
            <div className="flex-grow flex items-center justify-center font-bold text-lg">
              {initialLikelihood * initialImpact}
            </div>
          </div>
        </div>
        <div>
          <label>Control Measures</label>
          <textarea
            value={controlMeasures}
            onChange={(e) => setControlMeasures(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="block text-sm font-bold text-gray-700 col-span-3">
            Resultant Assessment
          </label>
          <div>
            <label>Likelihood (1-5)</label>
            <select
              value={resultantLikelihood}
              onChange={(e) => setResultantLikelihood(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {scoreOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Impact (1-5)</label>
            <select
              value={resultantImpact}
              onChange={(e) => setResultantImpact(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {scoreOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label>Risk</label>
            <div className="flex-grow flex items-center justify-center font-bold text-lg">
              {resultantLikelihood * resultantImpact}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Add Entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
