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
class EpisodeGroupTypes {

    static OriginalAirDate = new EpisodeGroupTypes(1)
    static Absolute = new EpisodeGroupTypes(2)
    static DVD = new EpisodeGroupTypes(3)
    static Digital = new EpisodeGroupTypes(4)
    static StoryArc = new EpisodeGroupTypes(5)
    static Production = new EpisodeGroupTypes(6)
    static TV = new EpisodeGroupTypes(7)

    constructor(value) {
      this.value = value;
    }

    get toString() {
      switch (this.value) {
        case EpisodeGroupTypes.OriginalAirDate.value:
         return 'Original airdate';
        case EpisodeGroupTypes.Absolute.value:
         return 'Absolute';
        case EpisodeGroupTypes.DVD.value:
         return 'DVD';
        case EpisodeGroupTypes.Digital.value:
         return 'Digital';
        case EpisodeGroupTypes.StoryArc.value:
         return 'Story arc';
        case EpisodeGroupTypes.Production.value:
         return 'Production';
        case EpisodeGroupTypes.TV.value:
          return 'TV';
        default:
          console.log('Eps Group not defined')
      }
    }
  }

class Gender {

    static Woman = new Gender(1)
    static Man = new Gender(2)
    static NonBinary = new Gender(3)

    constructor(value) {
      this.value = value;
    }

    get toString() {
      switch (this.value) {
        case Gender.Woman.value:
         return 'Woman';
        case Gender.Man.value:
         return 'Man'
        case Gender.NonBinary.value:
         return 'Non-binary'
        default:
          return 'N/A'
      }
    }
}
// const releaseTypeValues = Object.values(ReleaseTypes);
// const releaseTypeNames = releaseTypeValues.map(releaseType => releaseType.toString);

// console.log(releaseTypeValues)
// console.log(new ReleaseTypes(1).toString);
  // const ReleaseTypes = Object.freeze({
  //   Premiere : 1,
  //   TheatricalLimited : 2,
  //   Theatrical : 3,
  //   Digital : 4,
  //   Physical : 5,
  //   TV : 6,
  //   })

  module.exports = { MyEvents, ReleaseTypes, EpisodeGroupTypes, Gender};