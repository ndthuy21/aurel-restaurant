'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="section page-content empty">
      <h1>
        Có điều gì đó <em>gián đoạn.</em>
      </h1>
      <p>Vui lòng thử lại sau một chút.</p>
      <button className="button gold" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}
