import { useEffect, useState } from 'react'
import { BlockHelp } from './components/BlockHelp.tsx'
import { Candidates } from './components/Candidates.tsx'
import { Editor } from './components/Editor.tsx'
import { ElementView } from './components/ElementView.tsx'
import { ONBOARDING_KEY, Onboarding } from './components/Onboarding.tsx'
import { RunControls } from './components/StepBanner.tsx'
import { StepTape } from './components/StepTape.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { useCascade } from './store.ts'

function tourPending() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) !== 'done'
  } catch {
    return true
  }
}

export default function App() {
  const status = useCascade((state) => state.status)
  const speed = useCascade((state) => state.speed)
  const tick = useCascade((state) => state.tick)
  const [tour, setTour] = useState(tourPending)

  function closeTour() {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'done')
    } catch {
      // приватный режим может запретить запись
    }
    setTour(false)
  }

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(tick, speed)
    return () => window.clearInterval(id)
  }, [status, speed, tick])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (!meta) return
      if (event.key === 'Enter') {
        event.preventDefault()
        useCascade.getState().togglePlay()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        useCascade.getState().step()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-shell">
      <Toolbar onTour={() => setTour(true)} />
      {tour ? <Onboarding onClose={closeTour} /> : null}
      <main className="stage">
        <section className="panel zone zone-editor">
          <h2 className="zone-label">
            Редактор
            <BlockHelp
              label="Редактор"
              text="HTML и CSS этого примера. На шаге подсвечивается строка объявления, которое сейчас в разборе. Код можно изменить и пересчитать каскад."
              href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade"
            />
          </h2>
          <div className="zone-body">
            <Editor />
          </div>
        </section>
        <div className="right-rail">
        <RunControls />
        <section className="panel zone zone-tape">
          <h2 className="zone-label">
            Шаг каскада
            <BlockHelp
              label="Шаг каскада"
              text="Порядок разбора. Каждый пункт показывает, из чего сложился вес селектора и какое объявление из-за этого выбыло."
              href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade"
            />
          </h2>
          <div className="zone-body">
            <StepTape />
          </div>
        </section>
        <section className="panel zone zone-element">
          <h2 className="zone-label">
            Элемент
            <BlockHelp
              label="Элемент"
              text="Элемент, для которого считается каскад. Здесь видно, какое значение свойства уже выбрано и как оно выглядит."
              href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Value_processing"
            />
          </h2>
          <div className="zone-body">
            <ElementView />
          </div>
        </section>
        </div>
        <section className="panel zone zone-candidates">
          <h2 className="zone-label">
            Претенденты
            <BlockHelp
              label="Претенденты"
              text="Объявления, которые попали в элемент и спорят за одно свойство. У каждого видны вес и причина, если оно уже выбыло."
              href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity"
            />
          </h2>
          <div className="zone-body">
            <Candidates />
          </div>
        </section>
      </main>
      <footer className="umbrella">
        <a href="https://www.grasp-event-loop.dev/">JS · Event Loop</a>
        <span aria-current="page">CSS · Cascade</span>
      </footer>
    </div>
  )
}
