import { EXAMPLES } from '../examples.ts'
import { useCascade } from '../store.ts'

function nextInLevel(id: string) {
  const level = EXAMPLES.find((example) => example.id === id)?.level
  if (!level) return undefined
  const same = EXAMPLES.filter((example) => example.level === level)
  const index = same.findIndex((example) => example.id === id)
  return index >= 0 ? same[index + 1] : undefined
}

export function RunControls() {
  const status = useCascade((state) => state.status)
  const exampleId = useCascade((state) => state.exampleId)
  const setExample = useCascade((state) => state.setExample)
  const togglePlay = useCascade((state) => state.togglePlay)
  const step = useCascade((state) => state.step)
  const reset = useCascade((state) => state.reset)
  const next = status === 'done' && exampleId ? nextInLevel(exampleId) : undefined
  const runLabel = status === 'playing' ? 'Пауза' : status === 'paused' ? 'Продолжить' : 'Запуск'
  const index = useCascade((state) => state.index)
  const steps = useCascade((state) => state.steps)
  const current = index >= 0 ? index + 1 : 0
  const progress = `${current}/${steps.length}`

  return (
    <div className="run-controls">
      <button type="button" className="toolbar-btn toolbar-btn-run" onClick={step}>
        Шаг
      </button>
      <button type="button" className="toolbar-btn" onClick={togglePlay}>
        {runLabel}
      </button>
      <button type="button" className="toolbar-btn" onClick={reset}>
        Сброс
      </button>
      {next ? (
        <button type="button" className="toolbar-btn" onClick={() => setExample(next.id)}>
          Следующий пример
        </button>
      ) : null}
      <p className="step-count" aria-label={`Шаг ${current} из ${steps.length}`}>
        {progress}
      </p>
    </div>
  )
}
