import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CodeSample } from '../components/docs/CodeSample'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingNav } from '../components/landing/LandingNav'
import {
  acceptedResponse,
  docsSections,
  ingestSamples,
  requestFields,
  statusRows,
} from '../data/docsTutorial'

export function DocsPage() {
  const [activeId, setActiveId] = useState<string>(docsSections[0].id)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Developer tutorial - TraceSync AI'

    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    const nodes = docsSections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null)

    if (nodes.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (visible?.target.id) {
          setActiveId(visible.target.id)
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    )

    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="app-shell landing-page docs-page">
      <LandingNav />
      <main className="docs-shell">
        <nav className="docs-toc" aria-label="On this page">
          <p className="docs-toc-label">On this page</p>
          <ol className="docs-toc-list">
            {docsSections.map((section, index) => (
              <li key={section.id}>
                <a
                  className={activeId === section.id ? 'docs-toc-link is-active' : 'docs-toc-link'}
                  href={`#${section.id}`}
                >
                  <span className="docs-toc-index">{String(index + 1).padStart(2, '0')}</span>
                  {section.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="docs-article">
          <header className="docs-hero" id="start">
            <p className="docs-kicker">Developer tutorial</p>
            <h1 className="heading-display docs-title">Send a crash. Read the fix.</h1>
            <p className="text-body docs-lead">
              TraceSync accepts an error over HTTP, queues it, and writes an AI solution you can
              open in the dashboard. This page is the shortest path from an empty workspace to
              that saved row.
            </p>
            <div className="docs-hero-actions">
              <Link className="btn btn-primary" to="/register">
                Create a workspace
              </Link>
              <a className="btn btn-ghost" href="#send">
                Jump to the request
              </a>
            </div>
          </header>

          <section className="docs-section" aria-labelledby="flow-title">
            <h2 id="flow-title" className="docs-heading">
              What actually happens
            </h2>
            <ol className="docs-flow">
              <li>
                <span className="docs-flow-index">1</span>
                <div>
                  <p className="docs-flow-title">Your app posts the crash</p>
                  <p className="text-muted">
                    <code className="inline-code">POST /api/v1/errors</code> with the tenant key
                    in <code className="inline-code">x-api-key</code>.
                  </p>
                </div>
              </li>
              <li>
                <span className="docs-flow-index">2</span>
                <div>
                  <p className="docs-flow-title">Ingest returns 202</p>
                  <p className="text-muted">
                    NestJS checks the key in Redis, then enqueues the payload. The HTTP call does
                    not wait for the model.
                  </p>
                </div>
              </li>
              <li>
                <span className="docs-flow-index">3</span>
                <div>
                  <p className="docs-flow-title">A worker writes the row</p>
                  <p className="text-muted">
                    The worker asks the configured model for a fix, saves message, stack, and
                    solution, then the Errors page can show it.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section className="docs-section" id="project" aria-labelledby="project-title">
            <p className="docs-step-kicker">Step 01</p>
            <h2 id="project-title" className="docs-heading">
              Create a project
            </h2>
            <p className="text-body">
              Sign in, open <Link to="/projects">Projects</Link>, and create the application you
              want to monitor. The table&apos;s Project ID is the value you send as{' '}
              <code className="inline-code">project_id</code>. Send it as a string, even when the
              id is numeric. <code className="inline-code">{'"1"'}</code> is valid.{' '}
              <code className="inline-code">1</code> without quotes is not, because the field must
              be a string.
            </p>
          </section>

          <section className="docs-section" id="key" aria-labelledby="key-title">
            <p className="docs-step-kicker">Step 02</p>
            <h2 id="key-title" className="docs-heading">
              Copy the ingest key
            </h2>
            <p className="text-body">
              Open <Link to="/settings">Settings</Link> and reveal the ingest API key. Put it in
              an environment variable named <code className="inline-code">TRACESYNC_API_KEY</code>.
              The key identifies the tenant. Do not send <code className="inline-code">tenant_id</code>{' '}
              in the body. Extra fields are rejected.
            </p>
            <aside className="docs-callout">
              <p className="docs-callout-title">Keep the key on the server</p>
              <p className="text-muted">
                A browser bundle, mobile app, or public repo can leak it. Call ingest from your
                backend, a worker, or a local script.
              </p>
            </aside>
          </section>

          <section className="docs-section" id="send" aria-labelledby="send-title">
            <p className="docs-step-kicker">Step 03</p>
            <h2 id="send-title" className="docs-heading">
              Post one error
            </h2>
            <p className="text-body">
              Point the sample at your ingest host. Locally that is{' '}
              <code className="inline-code">http://127.0.0.1:3030</code>. Replace{' '}
              <code className="inline-code">project_id</code> with the id from your Projects table,
              then run it.
            </p>
            <CodeSample samples={ingestSamples} />
            <h3 className="docs-subheading">Accepted response</h3>
            <p className="text-body">
              A successful call answers immediately. <code className="inline-code">job_id</code>{' '}
              is the queue job, not the history row id.
            </p>
            <pre className="docs-pre docs-pre-static">
              <code>{acceptedResponse}</code>
            </pre>
          </section>

          <section className="docs-section" id="history" aria-labelledby="history-title">
            <p className="docs-step-kicker">Step 04</p>
            <h2 id="history-title" className="docs-heading">
              Open the saved crash
            </h2>
            <p className="text-body">
              Go to <Link to="/errors">Error history</Link>. The new row shows the message,
              project, time, and a short preview of the AI solution. Open the row for the full
              stack trace and the full solution.
            </p>
            <p className="text-body">
              If the list is still empty, wait a moment and refresh. The model runs after the 202.
              A failed analysis is retried up to three times with exponential backoff, starting at
              one second. <code className="inline-code">environment</code> is included in that
              analysis and does not appear as its own column on the detail page.
            </p>
          </section>

          <section className="docs-section" id="reference" aria-labelledby="reference-title">
            <h2 id="reference-title" className="docs-heading">
              Request reference
            </h2>
            <p className="text-body">
              <code className="inline-code">POST /api/v1/errors</code>
              <br />
              Header <code className="inline-code">Content-Type: application/json</code>
              <br />
              Header <code className="inline-code">x-api-key: &lt;tenant key&gt;</code>
            </p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Required</th>
                    <th scope="col">Limit</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {requestFields.map((field) => (
                    <tr key={field.name}>
                      <th scope="row">
                        <code className="inline-code">{field.name}</code>
                      </th>
                      <td>{field.required}</td>
                      <td>{field.limit}</td>
                      <td>{field.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="docs-subheading">Status codes</h3>
            <ul className="docs-status-list">
              {statusRows.map((row) => (
                <li key={row.code}>
                  <span className="docs-status-code">{row.code}</span>
                  <span>{row.meaning}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="docs-section" id="local" aria-labelledby="local-title">
            <h2 id="local-title" className="docs-heading">
              Local ports
            </h2>
            <dl className="docs-ports">
              <div>
                <dt>Dashboard</dt>
                <dd>
                  <code className="inline-code">http://127.0.0.1:5173</code>
                </dd>
              </div>
              <div>
                <dt>Laravel control plane</dt>
                <dd>
                  <code className="inline-code">http://127.0.0.1:8080</code>
                </dd>
              </div>
              <div>
                <dt>NestJS ingest</dt>
                <dd>
                  <code className="inline-code">http://127.0.0.1:3030</code>
                </dd>
              </div>
            </dl>
            <p className="text-muted docs-closing">
              Accounts, projects, and the API key come from Laravel. Crashes go to NestJS. The
              dashboard reads both.
            </p>
          </section>
        </article>
      </main>
      <LandingFooter />
    </div>
  )
}
