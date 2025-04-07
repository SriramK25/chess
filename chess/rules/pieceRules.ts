export interface IPawn {
  maxMoveRange: 1;
  initialMoveRange: 2;

  hasPromotion: true;
}

export interface IRook {
  maxMoveRange: 8;
  initialMoveRange: 8;
  hasPromotion: false;
}

export interface IBishop {
  maxMoveRange: 8;
  initialMoveRange: 8;
  hasPromotion: false;
}

export interface IKnight {
  maxMoveRange: 4;
  initialMoveRange: 4;
  hasPromotion: false;
}

export interface IQueen {
  maxMoveRange: 8;
  initialMoveRange: 8;
  hasPromotion: false;
}
