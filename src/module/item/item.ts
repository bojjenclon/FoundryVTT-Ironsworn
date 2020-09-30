export class IronswornItem extends Item {
  assetAbilityHtml(ability): string {
    const { description } = ability;

    const lines = description.split('\n');
    let numLines = lines.length;

    let inList = false;

    for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
      let line = lines[lineIdx];

      // Handle bullet point lists
      if (line.startsWith('* ')) {
        if (!inList) {
          lines.splice(lineIdx++, 0, '<ul>');
          numLines++;
          inList = true;
        }

        line = `<li>${line.substr(2).trim()}</li>`;
      } else if (inList) {
        lines.splice(lineIdx++, 0, '</ul>');
        numLines++;
        inList = false;
      }

      // Find italic
      const numUnderscores = (line.match(/\_/g) || []).length;
      let underscorePos = 0;
      let underscoreIdx = 0;
      while (underscoreIdx < numUnderscores) {
        underscorePos = line.indexOf('_', underscorePos);
        const matchPos = line.indexOf('_', underscorePos + 1);

        if (underscorePos > -1 && matchPos > -1) {
          const pre = line.substring(0, underscorePos);
          const inner = line.substring(underscorePos + 1, matchPos);
          const post = line.substring(matchPos + 1);

          line = `${pre}<em>${inner}</em>${post}`;
        }
        // Increment by two since underscores should appear in pairs
        underscoreIdx += 2;
      }

      // Find bold
      const numAsterisks = (line.match(/\*/g) || []).length;
      let asteriskPos = 0;
      let asteriskIdx = 0;
      while (asteriskIdx < numAsterisks) {
        asteriskPos = line.indexOf('*', asteriskPos);
        const matchPos = line.indexOf('*', asteriskPos + 1);

        if (asteriskPos > -1 && matchPos > -1) {
          const pre = line.substring(0, asteriskPos);
          const inner = line.substring(asteriskPos + 1, matchPos);
          const post = line.substring(matchPos + 1);

          line = `${pre}<strong>${inner}</strong>${post}`;
        }
        // Increment by two since underscores should appear in pairs
        asteriskIdx += 2;
      }

      lines[lineIdx] = line;
    }

    return lines.join('\n');
  }
}