// src/components/layout/footer.tsx
export function Footer() {
  return (
    <footer className="border-t mt-12 py-6">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <span>Built by Hardik Kapil</span>
        <span className="text-gray-300">·</span>
        
        <a
          href="https://github.com/HardikKapil1"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline underline-offset-2"
        >
          GitHub
        </a>
        <span className="text-gray-300">·</span>
        
        <a
          href="https://linkedin.com/in/hardik-kapil"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline underline-offset-2"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}