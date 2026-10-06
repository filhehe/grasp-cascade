import { layerLabel, originLabel } from '../engine/model.ts'
import { useCascade } from '../store.ts'

export function Candidates() {
  const steps = useCascade((state) => state.steps)
  const index = useCascade((state) => state.index)
  const seek = useCascade((state) => state.seek)
  const step = index >= 0 ? steps[index] : undefined
  const candidates = step?.candidates ?? []

  return (
    <div className="candidate-list">
      <p className="panel-kicker">
        {step?.property ? (
          <>
            спор за свойство: <span className="kicker-property">{step.property}</span>
          </>
        ) : (
          'Свойство появится на шаге'
        )}
      </p>
      {candidates.length === 0 ? (
        <p className="empty-note">На этом шаге претендентов нет.</p>
      ) : (
        <ul>
          {candidates.map((item) => {
            const note = [
              item.via ? `сокращение ${item.via}` : null,
              item.origin === 'author' ? null : originLabel(item.origin),
              item.layer ? layerLabel(item.layer) : null,
              item.reasonText,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`candidate is-${item.state}`}
                  onClick={() => {
                    const found = steps.findIndex((entry) => entry.focusId === item.id)
                    if (found >= 0) seek(found)
                  }}
                >
                  <span className="candidate-line">
                    <span className="candidate-selector">
                      {item.selector}
                      {item.important ? <span className="candidate-flag"> !</span> : null}
                    </span>
                    <span className="candidate-value">
                      <span className="candidate-arrow" aria-hidden="true">
                        →
                      </span>
                      {item.value}
                    </span>
                  </span>
                  {note ? <span className="candidate-note">{note}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
