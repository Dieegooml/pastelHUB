export default async function globalSetup() {
  const url = 'http://localhost:5173';
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`✓ Vite dev server running at ${url}`);
    } else {
      console.warn(`⚠ Vite dev server returned ${response.status}`);
    }
  } catch {
    console.warn('');
    console.warn('⚠ Vite dev server is NOT running at ' + url);
    console.warn('  Start it with: cd client && npm run dev');
    console.warn('  Or let Playwright auto-start it via webServer config.');
    console.warn('');
  }
}
