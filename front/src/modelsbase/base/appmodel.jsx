export class Equatable {
    equals(other) {
      if (other === null || other === undefined) return false;
      if (other.constructor !== this.constructor) return false;
      return JSON.stringify(this) === JSON.stringify(other);
    }
  }
  
  export class AppModel extends Equatable {
    get table() {
      throw new Error('Must implement table getter in subclass');
    }
  
    get docId() {
      throw new Error('Must implement docId getter in subclass');
    }
  
    get toJson() {
      throw new Error('Must implement toJson getter in subclass');
    }
  }