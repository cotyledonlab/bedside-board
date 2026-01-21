import { useState } from 'react'
import { DEFAULT_CARE_TEAM_ROLES } from '../storage'
import type { CareTeamMember } from '../storage'

interface CareTeamProps {
  members: CareTeamMember[]
  onAddMember: (member: Omit<CareTeamMember, 'id' | 'sortOrder'>) => void
  onUpdateMember: (member: CareTeamMember) => void
  onDeleteMember: (id: string) => void
}

/**
 * Component for managing care team contacts
 * Helps patients keep track of their doctors, nurses, and other care providers
 */
export default function CareTeam({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}: CareTeamProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'Primary Doctor',
    icon: '👨‍⚕️',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMember.name.trim()) return

    onAddMember({
      name: newMember.name.trim(),
      role: newMember.role,
      icon: newMember.icon,
      notes: newMember.notes.trim() || undefined,
    })

    setNewMember({ name: '', role: 'Primary Doctor', icon: '👨‍⚕️', notes: '' })
    setIsAdding(false)
  }

  const handleRoleChange = (role: string) => {
    const roleInfo = DEFAULT_CARE_TEAM_ROLES.find(r => r.role === role)
    setNewMember({
      ...newMember,
      role,
      icon: roleInfo?.icon || '👩‍⚕️',
    })
  }

  const handleEditSave = (member: CareTeamMember, updates: Partial<CareTeamMember>) => {
    onUpdateMember({ ...member, ...updates })
    setEditingId(null)
  }

  return (
    <section className="section" aria-labelledby="careteam-heading">
      <div className="section-header">
        <h2 id="careteam-heading" className="section-title">
          Care Team
        </h2>
        <button
          className="btn btn-small"
          onClick={() => setIsAdding(!isAdding)}
          aria-expanded={isAdding}
        >
          {isAdding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add member form */}
      {isAdding && (
        <form className="careteam-form" onSubmit={handleSubmit}>
          <div className="careteam-form-row">
            <label htmlFor="member-role" className="visually-hidden">
              Role
            </label>
            <select
              id="member-role"
              className="careteam-select"
              value={newMember.role}
              onChange={e => handleRoleChange(e.target.value)}
            >
              {DEFAULT_CARE_TEAM_ROLES.map(role => (
                <option key={role.role} value={role.role}>
                  {role.icon} {role.role}
                </option>
              ))}
            </select>
          </div>

          <div className="careteam-form-row">
            <label htmlFor="member-name" className="visually-hidden">
              Name
            </label>
            <input
              id="member-name"
              type="text"
              className="careteam-input"
              placeholder="Name (e.g., Dr. Smith)"
              value={newMember.name}
              onChange={e => setNewMember({ ...newMember, name: e.target.value })}
            />
          </div>

          <div className="careteam-form-row">
            <label htmlFor="member-notes" className="visually-hidden">
              Notes (optional)
            </label>
            <input
              id="member-notes"
              type="text"
              className="careteam-input"
              placeholder="Notes (optional, e.g., 'Rounds at 9am')"
              value={newMember.notes}
              onChange={e => setNewMember({ ...newMember, notes: e.target.value })}
            />
          </div>

          <button type="submit" className="btn" disabled={!newMember.name.trim()}>
            Add to Team
          </button>
        </form>
      )}

      {/* Team members list */}
      <div className="careteam-list" role="list" aria-label="Care team members">
        {members.length === 0 ? (
          <p className="careteam-empty">
            No care team members added yet. Add your doctors, nurses, and other care providers to
            keep track of who's helping you.
          </p>
        ) : (
          members.map(member => (
            <div key={member.id} className="careteam-card" role="listitem">
              {editingId === member.id ? (
                <div className="careteam-edit">
                  <input
                    type="text"
                    className="careteam-input"
                    defaultValue={member.name}
                    onBlur={e => handleEditSave(member, { name: e.target.value })}
                    autoFocus
                  />
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <span className="careteam-icon" aria-hidden="true">
                    {member.icon}
                  </span>
                  <div className="careteam-info">
                    <span className="careteam-name">{member.name}</span>
                    <span className="careteam-role">{member.role}</span>
                    {member.notes && <span className="careteam-notes">{member.notes}</span>}
                  </div>
                  <div className="careteam-actions">
                    <button
                      className="careteam-edit-btn"
                      onClick={() => setEditingId(member.id)}
                      aria-label={`Edit ${member.name}`}
                    >
                      Edit
                    </button>
                    <button
                      className="careteam-delete-btn"
                      onClick={() => onDeleteMember(member.id)}
                      aria-label={`Remove ${member.name} from care team`}
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
