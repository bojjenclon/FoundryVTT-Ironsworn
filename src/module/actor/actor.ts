export class IronswornActor extends Actor {
  /**
   * Rolls for a given stat, calculating the successes.
   * 
   * @param stat 
   * @param adds
   * @returns {Number} Number of successes
   */
  rollStat(stat: string, adds: Number = 0): Object {
    const statVal = this.data.data.stats[stat].value;

    const roll = new Roll('1d6 + @stat + @adds', { stat: statVal, adds }).roll();
    const check1 = new Roll('1d10').roll();
    const check2 = new Roll('1d10').roll();

    let successes = 0;
    if (roll.total < check1.total) {
      successes++;
    }
    if (roll.total < check2.total) {
      successes++;
    }

    return {
      roll: `${roll.result} = ${roll.total} vs (${check1.result}, ${check2.result})`,
      successes
    };
  }
}
