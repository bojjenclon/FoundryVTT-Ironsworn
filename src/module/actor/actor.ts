export class IronswornActor extends Actor {
  /**
   * Rolls for a given stat, calculating the successes.
   * 
   * @param stat 
   * @param adds
   * @returns {Number} Number of successes
   */
  rollStat(stat: string, adds : Number = 0) : Number {
    const statVal = this.data.data.stats[stat].value;
    
    const roll = new Roll('1d6 + @stat + @adds', { stat: statVal, adds }).roll().result;
    const check1 = new Roll('1d10').roll().result;
    const check2 = new Roll('1d10').roll().result;

    let success = 0;
    if (roll < check1) {
      success++;
    }
    if (roll < check2) {
      success++;
    }

    return success;
  }
}
