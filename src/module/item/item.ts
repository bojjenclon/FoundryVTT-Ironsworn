export class IronswornItem extends Item {
  assetAbilityHtml(ability): string {
    const { description } = ability;
    const lines = description.split('\n');

    let numLines = lines.length;
    let inList = false;
    for (let i = 0; i < numLines; i++) {
      const line = lines[i];
      if (line.startsWith('* ')) {
        if (!inList) {
          lines.splice(i++, 0, '<ul>');
          numLines++;
          inList = true;
        }

        lines[i] = `<li>${line.substr(2).trim()}</li>`;
      } else if (inList) {
        lines.splice(i++, 0, '</ul>');
        numLines++;
        inList = false;
      }
    }

    return lines.join('\n');
  }
}