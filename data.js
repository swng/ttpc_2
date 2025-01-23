/*========================================================================================
□■ data.js ■□
========================================================================================*/
/*----------------------------------------------------------------------------------------
☆★ List of constants ★☆
----------------------------------------------------------------------------------------*/
var MATRIX_WIDTH = 10;               // Number of side blocks of matrix
var DEADLINE_HEIGHT = 3;             // The height of retaining the block information over the deadline
var MATRIX_HEIGHT = 23;              // Matrix's vertical block number. Including deadline or higher
var SOFT_DROP_SPAN = 1;              // <Fre> Time to go 1 square with soft drop
var NATURAL_DROP_SPAN = 36;          // <Frame> Time to go 1 square by falling naturally
var LINE_CLEAR_DURATION = 1;        // <Fre> line erasing time time
var DISPLAY_FEATURES_DURATION = 45;  // <Fre> display time of activated technique
var NEXT_MINOS = 5;                  // Number display
var ROTATE_RULES = 5;                // Number of rotation rules
var HORIZONTAL_CHARGE_DURATION = 3;  // Time from <frame> Key to start pushing the key to the start of horizontal movement
var HORIZONTAL_REPEAT_SPAN = 0;      // <Fre> Side -to -side sense of time

var INITIAL_DIR = 0;                  // Mino orientation at the time of appearance
var INITIAL_X = 3;                    // Mino X coordinates at the time of appearance
var INITIAL_Y = DEADLINE_HEIGHT - 2;  // Mino's Y coordinate at the time of appearance

var DEFAULT_KEY_MOVE_LEFT    = 'Left';
var DEFAULT_KEY_MOVE_RIGHT   = 'Right';
var DEFAULT_KEY_SOFTDROP     = 'Down';
var DEFAULT_KEY_HARDDROP     = 'Up';
var DEFAULT_KEY_ROTATE_RIGHT = 'X';
var DEFAULT_KEY_ROTATE_LEFT = 'Z';
var DEFAULT_KEY_180 = 'A';
var DEFAULT_KEY_HOLD         = 'Shift';
var DEFAULT_KEY_GUIDE        = 'R';

var DUMP_GUIDE_DATA = true;            // For guide array dumps
var SECTION_NUM = 21;            // For guide array dumps

/*----------------------------------------------------------------------------------------
☆★ Matrix sequence  [y][x] ★☆

It is an array of the installed block. The blocks that are falling are managed separately.
----------------------------------------------------------------------------------------*/
var gMatrix = [];
for(var i = 0; i < MATRIX_HEIGHT; i++){
  gMatrix.push([]);
  for(var j = 0; j < MATRIX_WIDTH; j++){
    gMatrix[i].push(0);
  }
}
/*----------------------------------------------------------------------------------------
☆★ Object: Various blocks ★☆
----------------------------------------------------------------------------------------*/
function Block(id){
  this.id = id;
  this.toVanish = (id == 2);           // Is it a block that has been erased?
  switch(id){
    case 0:  // Vacant
    this.passable = true;    // Is it possible to slip through?
    break;
    case 1:  // Gray block
    this.passable = false;
    break;
    case 2:  // Block during erasing production. Erased at once with Removereservedlines
    this.passable = true;
    break;
    // Each block that has been installed
    case 21: case 22: case 23: case 24: case 25: case 26: case 27:
    this.passable = false;
    break;
    // Other blocks
    case 11: case 12: case 13: case 14: case 15: case 16: case 17:
    case 31: case 32: case 33: case 34: case 35: case 36: case 37:
    case 41: case 42: case 43: case 44: case 45: case 46: case 47:
    case 51: case 52: case 53: case 54: case 55: case 56: case 57:
    case 511: case 512: case 513: case 514: case 515: case 516: case 517:
    case 521: case 522: case 523: case 524: case 525: case 526: case 527:
    case 531: case 532: case 533: case 534: case 535: case 536: case 537:
    case 541: case 542: case 543: case 544: case 545: case 546: case 547:
    case 551: case 552: case 553: case 554: case 555: case 556: case 557:
    case 561: case 562: case 563: case 564: case 565: case 566: case 567:
    case 571: case 572: case 573: case 574: case 575: case 576: case 577:
    this.passable = false;
    break;
    // Other numbers (non -existent blocks) do not take the image cache
    default:
    this.passable = false;
    return;
  }

  this.image = 'img/b' + id + '.png';  // image. 24 x 24 pixels
  this.cache = new Image();
  this.cache.src = this.image;
}
/*----------------------------------------------------------------------------------------
☆★ Access to block objects ★☆
----------------------------------------------------------------------------------------*/
var gBlocks = [];
//for(var i = 0; i <= 57; i++) gBlocks.push(new Block(i));
for(var i = 0; i <= 577; i++) gBlocks.push(new Block(i));
function BlkEmpty(){return gBlocks[0] }
function BlkVanishing(){return gBlocks[2] }
/*----------------------------------------------------------------------------------------
☆★ Object: General rotation rules (Rotation Rule -General) ★☆
----------------------------------------------------------------------------------------*/
function RotRuleGen(){
  // [Rotation direction (0 = right, 1 = left, 2 = 180)] [Mino orientation before rotation (0 = right, 2 = reverse, 3 = left)] [Rule ID]
  this.dx = [[[0, -1, -1,  0, -1],    // i → r
  [0,  1,  1,  0,  1],    // r → v
  [0,  1,  1,  0,  1],    // v → l
  [0, -1, -1,  0, -1]],   // l → i
  [[0,  1,  1,  0,  1],   // i → l
  [0,  1,  1,  0,  1],    // r → i
  [0, -1, -1,  0, -1],    // v → r
  [0, -1, -1,  0, -1]],   // l → v
  [[0, 0, -1, 0, 1],       // i → v
  [0, 0, -1, 0, 1],        // r → l
  [0, 0, -1, 0, 1],        // v → i
  [0, 0, -1, 0, 1]]];      // l → r  
  this.dy = [[[0,  0, -1,  2,  2],    // i → r
  [0,  0,  1, -2, -2],    // r → v
  [0,  0, -1,  2,  2],    // v → l
  [0,  0,  1, -2, -2]],   // l → i
  [[0,  0, -1,  2,  2],    // i → l
  [0,  0,  1, -2, -2],    // r → i
  [0,  0, -1,  2,  2],    // v → r
  [0,  0,  1, -2, -2]],  // l → v
  [[0, 1, 0, -1, 0],       // i → v
  [0, 1, 0, -1, 0],        // r → l
  [0, 1, 0, -1, 0],        // v → i
  [0, 1, 0, -1, 0]]];      // l → r
  return this;
}
/*----------------------------------------------------------------------------------------
☆★ Object: I Mino Rotation Rule (Rotation Rule --I) ★☆
----------------------------------------------------------------------------------------*/
function RotRuleI(){
  // [Rotation direction (0 = right, 1 = left, 2 = 180)] [Mino orientation before rotation (0 = right, 2 = reverse, 3 = left)] [Rule ID]
  this.dx = [[[0, -2,  1, -2,  1],    // i → r
  [0, -1,  2, -1,  2],    // r → v
  [0,  2, -1,  2, -1],    // v → l
  [0,  1, -2,  1, -2]],   // l → i
  [[0, -1,  2, -1,  2],    // i → l
  [0,  2, -1,  2, -1],    // r → i
  [0,  1, -2,  1, -2],    // v → r
  [0, -2,  1, -2,  1]],  // l → v
  [[0, 0, 0, 0, 0],       // i → v
  [0, 0, 0, 0, 0],        // r → l
  [0, 0, 0, 0, 0],        // v → i
  [0, 0, 0, 0, 0]]];      // l → r
  this.dy = [[[0,  0,  0,  1, -2],    // i → r
  [0,  0,  0, -2,  1],    // r → v
  [0,  0,  0, -1,  2],    // v → l
  [0,  0,  0,  2, -1]],   // l → i
  [[0,  0,  0, -2,  1],    // i → l
  [0,  0,  0, -1,  2],    // r → i
  [0,  0,  0,  2, -1],    // v → r
  [0,  0,  0,  1, -2]],  // l → v
  [[0, 0, 0, 0, 0],       // i → v
  [0, 0, 0, 0, 0],        // r → l
  [0, 0, 0, 0, 0],        // v → i
  [0, 0, 0, 0, 0]]];      // l → r
  return this;
}
/*----------------------------------------------------------------------------------------
☆★ Access setting for each rotation rule ★☆
----------------------------------------------------------------------------------------*/
var gRotationRuleGeneral = new RotRuleGen();
var gRotationRuleI = new RotRuleI();
/*----------------------------------------------------------------------------------------
☆★ Object: Various Minino ★☆
----------------------------------------------------------------------------------------*/
function IMino(){
  this.id = 1;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 0, 1, 0],
  [0, 0, 1, 0],
  [0, 0, 1, 0],
  [0, 0, 1, 0]],

  [[0, 0, 0, 0],
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0]]];
  this.activeBlockId = 11;
  this.placedBlockId = 21;
  this.ghostBlockId  = 31;
  this.guideBlockId  = 41;
  this.ghostGuideBlockId = 51;
  this.rotationRule = gRotationRuleI;
  return this;
}
//----------------------------------------------------------------------------------------
function TMino(){
  this.id = 2;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[0, 1, 0, 0],
  [1, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]],

  [[0, 0, 0, 0],
  [1, 1, 1, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [1, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]]];
  this.activeBlockId = 12;
  this.placedBlockId = 22;
  this.ghostBlockId  = 32;
  this.guideBlockId  = 42;
  this.ghostGuideBlockId = 52;
  this.rotationRule = gRotationRuleGeneral;
  return this;
}
//----------------------------------------------------------------------------------------
function JMino(){
  this.id = 3;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[1, 0, 0, 0],
  [1, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 1, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]],

  [[0, 0, 0, 0],
  [1, 1, 1, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [0, 1, 0, 0],
  [1, 1, 0, 0],
  [0, 0, 0, 0]]];
  this.activeBlockId = 13;
  this.placedBlockId = 23;
  this.ghostBlockId  = 33;
  this.guideBlockId  = 43;
  this.ghostGuideBlockId = 53;
  this.rotationRule = gRotationRuleGeneral;
  return this;
}
//----------------------------------------------------------------------------------------
function LMino(){
  this.id = 4;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[0, 0, 1, 0],
  [1, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0]],

  [[0, 0, 0, 0],
  [1, 1, 1, 0],
  [1, 0, 0, 0],
  [0, 0, 0, 0]],

  [[1, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]]];
  this.activeBlockId = 14;
  this.placedBlockId = 24;
  this.ghostBlockId  = 34;
  this.guideBlockId  = 44;
  this.ghostGuideBlockId = 54;
  this.rotationRule = gRotationRuleGeneral;
  return this;
}
//----------------------------------------------------------------------------------------
function ZMino(){
  this.id = 5;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[1, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 0, 1, 0],
  [0, 1, 1, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]],

  [[0, 0, 0, 0],
  [1, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [1, 1, 0, 0],
  [1, 0, 0, 0],
  [0, 0, 0, 0]]];
  this.activeBlockId = 15;
  this.placedBlockId = 25;
  this.ghostBlockId  = 35;
  this.guideBlockId  = 45;
  this.ghostGuideBlockId = 55;
  this.rotationRule = gRotationRuleGeneral;
  return this;
}
//----------------------------------------------------------------------------------------
function SMino(){
  this.id = 6;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[0, 1, 1, 0],
  [1, 1, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 0]],

  [[0, 0, 0, 0],
  [0, 1, 1, 0],
  [1, 1, 0, 0],
  [0, 0, 0, 0]],

  [[1, 0, 0, 0],
  [1, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0]]];
  this.activeBlockId = 16;
  this.placedBlockId = 26;
  this.ghostBlockId  = 36;
  this.guideBlockId  = 46;
  this.ghostGuideBlockId = 56;
  this.rotationRule = gRotationRuleGeneral;
  return this;
}
//----------------------------------------------------------------------------------------
function OMino(){
  this.id = 7;
  // [Mino orientation (0 = when appearing, 1 = right, 2 = reverse, 3 = left)] [Y coordinates] [X coordinates]
  this.shape = [[[0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],

  [[0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]]];
  this.activeBlockId = 17;
  this.placedBlockId = 27;
  this.ghostBlockId  = 37;
  this.guideBlockId  = 47;
  this.ghostGuideBlockId = 57;
  this.rotationRule = gRotationRuleGeneral;  // I don't need it, but for convenience
  return this;
}
/*----------------------------------------------------------------------------------------
★☆ The block position used for T-SPIN judgment ☆★

Called from TSTYPE of ttt.js. [DIR] [Y] [X]
If more than three of the places (4 locations each) cannot pass, it will be judged as T-Spin.
----------------------------------------------------------------------------------------*/
var gTsTiles = [[[1, 0, 1, 0],
[0, 0, 0, 0],
[1, 0, 1, 0],
[0, 0, 0, 0]],
[[1, 0, 1, 0],
[0, 0, 0, 0],
[1, 0, 1, 0],
[0, 0, 0, 0]],
[[1, 0, 1, 0],
[0, 0, 0, 0],
[1, 0, 1, 0],
[0, 0, 0, 0]],
[[1, 0, 1, 0],
[0, 0, 0, 0],
[1, 0, 1, 0],
[0, 0, 0, 0]]];
/*----------------------------------------------------------------------------------------
★☆ The block position used for T-Spin mini judgment ☆★

Called from TSTYPE of ttt.js. [DIR] [Y] [X]
//----------------------------------------------------------------------------------------
If T-Spin is established, determine whether it is a normal T-spin or T-Spin mini.
If the place (2 locations each) cannot be passed in two places (2 places each), T-Spin, otherwise, T-Spin.
It is judged as mini. Exceptionally, if you rotate the fifth candidate just before, it will not be T-Spin mini.
(TST-like rotation, "T-Spin Fin", etc.).
----------------------------------------------------------------------------------------*/
var gTssTiles = [[[1, 0, 1, 0],
[0, 0, 0, 0],
[0, 0, 0, 0],
[0, 0, 0, 0]],
[[0, 0, 1, 0],
[0, 0, 0, 0],
[0, 0, 1, 0],
[0, 0, 0, 0]],
[[0, 0, 0, 0],
[0, 0, 0, 0],
[1, 0, 1, 0],
[0, 0, 0, 0]],
[[1, 0, 0, 0],
[0, 0, 0, 0],
[1, 0, 0, 0],
[0, 0, 0, 0]]];
/*----------------------------------------------------------------------------------------
☆★ Access setting for each Mino ★☆
----------------------------------------------------------------------------------------*/
var I = new IMino();
var T = new TMino();
var J = new JMino();
var L = new LMino();
var Z = new ZMino();
var S = new SMino();
var O = new OMino();
var gMino = [null, I, T, J, L, Z, S, O];
/*----------------------------------------------------------------------------------------
☆★ Object: Guide ★☆

Mino, the one that is moving now is selected。
----------------------------------------------------------------------------------------*/
function Guide(mino, dir, x, y){
  this.mino = mino;
  this.dir = dir;
  this.x = x;
  this.y = y;  // Do not include the deadline
}
/*----------------------------------------------------------------------------------------
☆★ Simple notation of guide object generation ★☆
----------------------------------------------------------------------------------------*/
function G(mino, dir, x, y){
  return new Guide(mino, dir, x, y);
}
/*----------------------------------------------------------------------------------------
☆★ Acquisition of section name ★☆

<Id> Get the number name name. If you edit this, don't forget to reflect it in index.html.
 Please let me know.
----------------------------------------------------------------------------------------*/
function SectionTitle(id){
  switch(id){
    case  0: return '1  PC Opener Warmup'; break;
    case  1: return '2  「I Mino Vertical Placements」 14 Patterns'; break;
    case  2: return '3  「I Mino Vertical Placements」'; break;
    case  3: return '4  「Starting I Mino 1st Row」 6 Patterns'; break;
    case  4: return '5  「Starting I Mino 1st Row」 20Q'; break;
    case  5: return '6  「All Laying Down Form」 4 Patterns'; break;
    case  6: return '7  「All Laying Down Form」 20Q'; break;
    case  7: return '8  「IILO Form」 2 Patterns'; break;
    case  8: return '9  「IILO Form」 10Q'; break;
    case  9: return '10 「Starting I Mino 3rd Row」 3 Patterns'; break;
    case 10: return '11 「Starting I Mino 3rd Row」 20Q'; break;
    case 11: return '12 Midterm Exam 20Q'; break;
    case 12: return '13 「LSIO Form」 Total 1 Pattern'; break;
    case 13: return '14 「LSIO Form」 12Q'; break;
    case 14: return '15 Final Exam 30Q'; break;
    case 15: return '16 Graduation Exam（Mirrored Questions Included）100Q'; break;
    case 16: return '17 Other Solution Methods'; break;
    case 17: return '18 「I Mino Vertical Placement」 Total 514Q'; break;
    case 18: return '19 「I Mino Horizontal Placement」 Total 196Q'; break;
    case 19: return '20 Total 711Q'; break;
    case 20: return '21 Total 711Q Mirrored (Contents Unchecked)'; break;
  }
  return "?";
}
