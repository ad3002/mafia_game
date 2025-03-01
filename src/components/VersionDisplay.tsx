// Using require for package.json since we need CommonJS import
const { version } = require('../../package.json') as { version: string };

export function VersionDisplay() {
  return (
    <div className="fixed bottom-2 right-2 text-gray-400 text-sm">
      v{version}
    </div>
  );
}