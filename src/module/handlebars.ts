import { Ironsworn } from "./config";

export const registerHandlebars = () => {
  Handlebars.registerHelper('repeat', (times, block) => {
    const out = [];
    const data = {
      index: 0
    };

    for (let i = 0; i < times; i++) {
      data.index = i;

      out.push(
        block.fn(this, {
          data
        })
      );
    }

    return out.join('');
  });

  Handlebars.registerHelper('withSign', val => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val}`;
  });

  Handlebars.registerHelper('concat', (v1, v2) => `${v1}${v2}`);

  Handlebars.registerHelper('add', (lhs, rhs) => {
    return parseInt(lhs) + rhs;
  });

  Handlebars.registerHelper('lt', (lhs, rhs) => {
    return lhs < rhs;
  });

  Handlebars.registerHelper('lte', (lhs, rhs) => {
    return lhs <= rhs;
  });

  Handlebars.registerHelper('ge', (lhs, rhs) => {
    return lhs > rhs;
  });

  Handlebars.registerHelper('gte', (lhs, rhs) => {
    return lhs >= rhs;
  });

  Handlebars.registerHelper('rankName', val => {
    return Ironsworn.rank[val];
  });

  Handlebars.registerHelper('convertNewLines', text => {
    const lines = text.split('\n');
    return lines.join('<br>');
  });

  // This is not a true markdown implementation, it is a custom
  // subset based on the needs of text in this system.
  Handlebars.registerHelper('formatMarkdown', text => {
    const lines = text.split('\n');
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
        lines.splice(++lineIdx, 0, '</ul>');
        numLines++;
        inList = false;
      } else if (line.length > 0) {
        line = `<p>${line}</p>`;
      } else {
        line = `<br>`;
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

      if (inList && lineIdx === numLines - 1) {
        lines.splice(++lineIdx, 0, '</ul>');
        numLines++;
        inList = false;
      }
    }

    return lines.join('\n');
  });
}
