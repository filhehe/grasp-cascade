import { useEffect, useRef } from 'react'
import { useCascade } from '../store.ts'

export function StepTape() {
  const steps = useCascade((state) => state.steps)
  const index = useCascade((state) => state.index)
  const seek = useCascade((state) => state.seek)
  const currentRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' })
  }, [index])

  return (
    <ol className="tape">
      {steps.map((step, stepIndex) => {
        const tone = stepIndex === index ? 'is-current' : index < 0 || stepIndex > index ? 'is-future' : 'is-past'
        return (
          <li key={stepIndex}>
            <button
              ref={stepIndex === index ? currentRef : undefined}
              type="button"
              className={`tape-step ${tone}`}
              onClick={() => seek(stepIndex)}
            >
              <span className="tape-index">{stepIndex + 1}</span>
              <span className="tape-message">{step.message}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
