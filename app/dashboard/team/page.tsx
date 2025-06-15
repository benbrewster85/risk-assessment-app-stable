"use client";

import { createClient } from "@/lib/supabase/client";
import { TeamMember } from "@/lib/types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function TeamPage() {
  const supabase = createClient();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(
    null
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, team_id")
          .eq("id", user.id)
          .single();
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setLoading(false);
          return;
        }
        if (profileData) {
          setCurrentUserRole(profileData.role);
          setCurrentUserTeamId(profileData.team_id);
          // CORRECTED: The select statement now matches the TeamMember type
          const { data: membersData, error: membersError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, role")
            .eq("team_id", profileData.team_id);
          if (membersError) {
            console.error("Error fetching team members:", membersError);
          } else if (membersData) {
            setTeamMembers(membersData);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !currentUserTeamId) return;
    setIsInviting(true);
    const { error } = await supabase.from("invites").insert({
      email: inviteEmail,
      role: inviteRole,
      token: uuidv4(),
      team_id: currentUserTeamId,
    });
    if (error) {
      alert(`Error sending invite: ${error.message}`);
    } else {
      alert(
        `Invite created for ${inviteEmail}. They can now sign up to join your team.`
      );
      setInviteEmail("");
    }
    setIsInviting(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      alert(`Error updating role: ${error.message}`);
    } else {
      setTeamMembers((currentMembers) =>
        currentMembers.map((m) =>
          m.id === userId ? { ...m, role: newRole } : m
        )
      );
    }
  };

  if (loading) return <p className="p-8">Loading team members...</p>;

  const isAdmin = currentUserRole === "team_admin";

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Team Management</h1>
        {isAdmin ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-2xl font-bold mb-4">Invite New Member</h2>
              <form
                onSubmit={handleInviteUser}
                className="flex items-end space-x-4"
              >
                <div className="flex-grow">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="new.member@email.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="user">User</option>
                    <option value="team_admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </form>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Current Members</h2>
              <ul className="divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <li
                    key={member.id}
                    className="py-4 flex justify-between items-center"
                  >
                    <div>
                      {/* CORRECTED: Display name logic updated */}
                      <p className="font-medium">
                        {`${member.first_name || ""} ${
                          member.last_name || ""
                        }`.trim() || "Unnamed User"}
                      </p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value)
                      }
                      className="block w-40 rounded-md border-gray-300 shadow-sm"
                    >
                      <option value="user">User</option>
                      <option value="team_admin">Admin</option>
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-red-600">
            You do not have permission to manage this team.
          </p>
        )}
      </div>
    </div>
  );
}
