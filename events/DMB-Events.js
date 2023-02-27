class MyEvents {
    static Collect = 'collect';
    static Dispose = 'dispose';
    static Ignore = 'ignore';
    static End = 'end';
  }

class ReleaseTypes {
    static Premiere = new ReleaseTypes(1)
    static TheatricalLimited = new ReleaseTypes(2)
    static Theatrical = new ReleaseTypes(3)
    static Digital = new ReleaseTypes(4)
    static Physical = new ReleaseTypes(5)
    static TV = new ReleaseTypes(6)

    constructor(value) {
      this.value = value;
    }

    get toString() {
      switch (this.value) {
        case ReleaseTypes.Premiere.value:
         return 'Premiere';
        case ReleaseTypes.TheatricalLimited.value:
         return 'Theatrical Limited'
        case ReleaseTypes.Theatrical.value:
         return 'Theatrical';
        case ReleaseTypes.Digital.value:
         return 'Digital';
        case ReleaseTypes.Physical.value:
         return 'Physical';
        case ReleaseTypes.TV.value:
          return 'TV';
        default:
          console.log('season not defined')
      }
    }
  }
// console.log(new ReleaseTypes(1).toString);
  // const ReleaseTypes = Object.freeze({
  //   Premiere : 1,
  //   TheatricalLimited : 2,
  //   Theatrical : 3,
  //   Digital : 4,
  //   Physical : 5,
  //   TV : 6,
  //   })

  module.exports = { MyEvents, ReleaseTypes };