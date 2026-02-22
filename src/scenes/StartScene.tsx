import { useState } from 'react'

import { useCharacterStore, useUIStore } from '../store'
import type { PlayerClass } from '../types'

export default function StartScene() {
  const { characters, createCharacter, selectCharacter, deleteCharacter } = useCharacterStore()
  const setShowStartScreen = useUIStore((s) => s.setShowStartScreen)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newClass, setNewClass] = useState<PlayerClass>('warrior')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    createCharacter(newName.trim(), newClass)
    setNewName('')
    setShowCreate(false)
  }

  const handleSelect = (id: string) => {
    selectCharacter(id)
    setShowStartScreen(false)
  }

  const handleDelete = (id: string) => {
    deleteCharacter(id)
    setDeleteConfirm(null)
  }

  const classIcons: Record<PlayerClass, string> = {
    warrior: '⚔️',
    archer: '🏹',
    mage: '🔮',
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Ascension</h1>
      <h2 style={styles.subtitle}>The Lost Archives</h2>

      {!showCreate && (
        <div style={styles.characterList}>
          {characters.length === 0 ? (
            <p style={styles.emptyText}>No characters yet. Create one to begin!</p>
          ) : (
            characters.map((char) => (
              <div key={char.id} style={styles.characterCard}>
                <div style={styles.characterIcon}>{classIcons[char.class]}</div>
                <div style={styles.characterInfo}>
                  <div style={styles.characterName}>{char.name}</div>
                  <div style={styles.characterClass}>
                    {char.class} · Level {char.stats.level} · Floor {char.stats.highestFloor}
                  </div>
                </div>
                <div style={styles.characterActions}>
                  <button style={styles.playButton} onClick={() => handleSelect(char.id)}>
                    Play
                  </button>
                  {deleteConfirm === char.id ? (
                    <>
                      <button style={styles.confirmButton} onClick={() => handleDelete(char.id)}>
                        Confirm
                      </button>
                      <button style={styles.cancelButton} onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button style={styles.deleteButton} onClick={() => setDeleteConfirm(char.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCreate && (
        <div style={styles.createForm}>
          <input
            style={styles.input}
            type="text"
            placeholder="Character Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <div style={styles.classSelect}>
            {(['warrior', 'archer', 'mage'] as PlayerClass[]).map((c) => (
              <button
                key={c}
                style={{
                  ...styles.classButton,
                  ...(newClass === c ? styles.classButtonActive : {}),
                }}
                onClick={() => setNewClass(c)}
              >
                <span style={styles.classIcon}>{classIcons[c]}</span>
                <span>{c}</span>
              </button>
            ))}
          </div>
          <div style={styles.formActions}>
            <button style={styles.createButton} onClick={handleCreate}>
              Create
            </button>
            <button style={styles.cancelButton} onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showCreate && (
        <button style={styles.newButton} onClick={() => setShowCreate(true)}>
          New Character
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    fontSize: 48,
    margin: 0,
    textShadow: '0 4px 8px rgba(0,0,0,0.5)',
  },
  subtitle: {
    fontSize: 20,
    margin: '8px 0 32px',
    opacity: 0.8,
    fontWeight: 400,
  },
  characterList: {
    width: 400,
    maxWidth: '90vw',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 24,
  },
  characterCard: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  characterIcon: {
    fontSize: 32,
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 600,
  },
  characterClass: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  characterActions: {
    display: 'flex',
    gap: 8,
  },
  playButton: {
    padding: '8px 16px',
    background: '#4a8a4a',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  deleteButton: {
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 4,
    color: '#ff6666',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '8px 12px',
    background: '#a44',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
  },
  createForm: {
    width: 400,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    padding: 16,
    fontSize: 18,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#fff',
    outline: 'none',
  },
  classSelect: {
    display: 'flex',
    gap: 12,
  },
  classButton: {
    flex: 1,
    padding: 16,
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid transparent',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  classButtonActive: {
    background: 'rgba(74, 138, 74, 0.3)',
    borderColor: '#4a8a4a',
  },
  classIcon: {
    fontSize: 32,
  },
  formActions: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  createButton: {
    flex: 1,
    padding: 16,
    background: '#4a8a4a',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
  },
  newButton: {
    marginTop: 24,
    padding: '16px 32px',
    background: 'transparent',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 16,
  },
}
