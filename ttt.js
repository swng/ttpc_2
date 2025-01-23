/*========================================================================================
 □■ ttt.js ■□
========================================================================================*/
/*----------------------------------------------------------------------------------------
 ☆★ List of global variables ★☆
----------------------------------------------------------------------------------------*/
var gButton;          // The name of the pressed button. Initialized at the end of the frame (empty character string fee)
var gLyrSections;     // Section selection layer (Layer)
var gLyrPerform;      // Game layer
var gLyrPreferences;  // Setting layer
var gScene;           // Scene name
var gPrevScene;       // Scene name in the previous frame (PREVious SCENE)
/*
● Scene structure
 select_sections ⇔ preferences
   ↓↑
 perform
*/
var gKeys;            // Names of the keys
var gSelectForms = ['key_left', 'key_right', 'key_softdrop', 'key_harddrop',
                    'key_rot_right', 'key_rot_left' , 'key_hold' , 'key_guide', 'key_rot_180'];  // Names of the key selection box
/*
 To add a key, add it to LoadData() and SavePreferences(), and also use Key**() (the key name)
 Don't forget to add the getter method and the set select box.
*/

var gCurSectionId;    // Current section ID
var gCurProblemId;    // Selected problem ID
var gCurProblem;      // The selected problem object
var gCurProblemReq;   // Problem quota
var gQueue;           // Next queue
var gCurMino;
var gCurHold;
var gCurUseGuideFlg   // Whether to use the guide
var gCurX;
var gCurY;
var gCurDir;
var gNdCount;         // ( Natural Drop COUNT )
var gDfCount;         // ( Display Features COUNT )
var gCurGuide;        // Current guide
var gGuidesQueue;     // Guides array

var gLineClearCount;  // Line clearing count
var gTSpinType;       // 0= No T spin, 1= T spin mini, 2= T spin
var gRens;            // ongoing REN count
var gIsReadyToB2b;    // Could the next one be BACK to BACK?

/*----------------------------------------------------------------------------------------
 ☆★ Access settings for each question ★☆

 The problem data is described in problem.js etc.
----------------------------------------------------------------------------------------*/
var gProblems = getProblems();
var gCurProgmeIdList = [];
var gProblemsCleared = [];
for(var i = 0; i < SECTION_NUM; i++){
  gProblemsCleared[i] = false;
}

/*----------------------------------------------------------------------------------------
 ☆★ Initialization★☆

 This is called once at startup. The number of elapsed frames is treated as 0.
----------------------------------------------------------------------------------------*/
function Setup(){
  SetupLayers();
  gButton = '';
  gPrevScene = '';
  gScene = 'select_section';
  LoadData();
}
/*----------------------------------------------------------------------------------------
 ☆★Layer Initialization★☆

 The layer size etc. are defined in the CSS file, and the content is defined in the HTML.
----------------------------------------------------------------------------------------*/
function SetupLayers(){
  gLyrSections = new Layer('list_sections');
  gLyrPerform = new Layer('perform');
  gLyrPreferences = new Layer('preferences');
}
/*----------------------------------------------------------------------------------------
 ☆★ Loading ★☆

 Reads settings and progress from cookies.
----------------------------------------------------------------------------------------*/
function LoadData(){
  // Read the key settings
  gKeys = [];
  gKeys.push(Load('MoveLeft', DEFAULT_KEY_MOVE_LEFT));
  gKeys.push(Load('MoveRight', DEFAULT_KEY_MOVE_RIGHT));
  gKeys.push(Load('SoftDrop', DEFAULT_KEY_SOFTDROP));
  gKeys.push(Load('HardDrop', DEFAULT_KEY_HARDDROP));
  gKeys.push(Load('RotateRight', DEFAULT_KEY_ROTATE_RIGHT));
  gKeys.push(Load('RotateLeft', DEFAULT_KEY_ROTATE_LEFT));
  gKeys.push(Load('Hold', DEFAULT_KEY_HOLD));
    gKeys.push(Load('Guide', DEFAULT_KEY_GUIDE));
    gKeys.push(Load('Rotate180', DEFAULT_KEY_180));
  // Load the progress
  for(var i = 0; i < SECTION_NUM; i++){
    gProblemsCleared[i] = (Load('Prg' + i, '0') == '1');
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ In-frame processing ★☆

 This process is called once per frame. Frame management is done by jsmod.js.
----------------------------------------------------------------------------------------*/
function Main(){
  // Switch if the scene has changed
  if(gPrevScene != gScene){
    TerminateScene(gPrevScene);
    SetupScene(gScene);
    // Update the "previous scene"
    gPrevScene = gScene;
  }
  PerformScene(gScene);
  gButton = '';
}
/*----------------------------------------------------------------------------------------
 ☆★ Scene start ★☆
----------------------------------------------------------------------------------------*/
function SetupScene(scene){
  switch(scene){
  case 'select_section':
    gLyrSections.Show();
    RefreshProblemButtons();
    gCurUseGuideFlg = false;
    break;
  case 'perform':
    gCurMino = null;
    gCurHold = null;
    PrepareProblem();
    Refresh();
    gLyrPerform.Show();
    window.scroll(0, 0);    // scroll to the top
    break;
  case 'perform_falling':
    break;
  case 'perform_failed':
    Refresh();
    Say('perform_hint', 'Press Any Key To Retry');
    Say('perform_caption', 'Failed...');
    break;
  case 'perform_cleared':
    Refresh();
    gCurUseGuideFlg = false;
    var curProblemId = gCurProgmeIdList[gCurProblemId];
    Say('perform_caption', 'Clear!');
    break;
  case 'perform_guide':
    Refresh();
    gCurUseGuideFlg = true;
    Say('perform_hint', 'Press Any Key To Begin');
    Say('perform_caption', 'Using Guide');
    break;
  case 'preferences':
    // Display of key settings
    for(var i = 0; i < gKeys.length; i++){
      document.getElementById(gSelectForms[i]).value = gKeys[i];
    }
    gLyrPreferences.Show();
    window.scroll(0, 0);    // scroll to the top
    break;
  default:
    gScene = 'select_section';
    break;
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ Scene End ★☆
----------------------------------------------------------------------------------------*/
function TerminateScene(scene){
  switch(scene){
  case 'select_section':
    gLyrSections.Hide();
    break;
  case 'perform':
    if(gScene == 'select_section') gLyrPerform.Hide();
    break;
  case 'perform_falling':
    if(gScene == 'select_section') gLyrPerform.Hide();
    break;
  case 'perform_failed':
    if(gScene == 'select_section') gLyrPerform.Hide();
    break;
  case 'perform_cleared':
    if(gScene == 'select_section' || gScene == 'select_section') gLyrPerform.Hide();
    break;
  case 'perform_guide':
    if(gScene == 'select_section') gLyrPerform.Hide();
    break;
  case 'preferences':
    gLyrPreferences.Hide();
    break;
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ Scene processing ★☆
----------------------------------------------------------------------------------------*/
function PerformScene(scene){
  switch(scene){
  case 'select_section':
    SceneSelectSection();
    break;
  case 'perform':
    ScenePerform();
    break;
  case 'perform_falling':
    ScenePerformFalling();
    break;
  case 'perform_failed':
    ScenePerformFailed();
    break;
  case 'perform_guide':
    ScenePerformGuideMode();
    break;
  case 'perform_cleared':
    ScenePerformCleared();
    break;
  case 'preferences':
    ScenePreferences();
    break;
  default:
    gScene = 'select_section';
    break;
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ Problem Preparation ★☆
----------------------------------------------------------------------------------------*/
function PrepareProblem(){

  var curProblemId = gCurProgmeIdList[gCurProblemId];
  gCurProblem = gProblems[curProblemId];

  // Deep copy the norm array
  gCurProblemReq = [];
  for(var i = 0; i < gCurProblem.req.length; i++){
    gCurProblemReq.push(gCurProblem.req[i]);
  }

  // Intelligence representation
  DisplayCaption();
  RefreshHint();
  // Prepare the matrix
  for(var i = 0; i < DEADLINE_HEIGHT; i++){
    for(var j = 0; j < MATRIX_WIDTH; j++){
      gMatrix[i][j] = 0;
    }
  }
  for(var i = DEADLINE_HEIGHT; i < MATRIX_HEIGHT; i++){
    for(var j = 0; j < MATRIX_WIDTH; j++){
      gMatrix[i][j] = gCurProblem.initialBlocks[i - DEADLINE_HEIGHT][j];
    }
  }
  // Prepare for next
  gQueue = [];
  gGuidesQueue = [];
  gCurHold = gCurProblem.ingredients[0][0];
  for(var i = 1; i < gCurProblem.ingredients.length; i++){
    gQueue.push(gCurProblem.ingredients[i]);
  }
  for(var i = 0; i < gCurProblem.guides.length; i++){
    gGuidesQueue.push(gCurProblem.guides[i]);
  }
  // Initialize various flags
  gLineClearCount = -1;
  gTSpinType = 0;
  gRens = -1;
  gIsReadyToB2b = false;
}
/*----------------------------------------------------------------------------------------
 ☆★ Show question title ★☆
----------------------------------------------------------------------------------------*/
function DisplayCaption(){
  var curProblemId = gCurProgmeIdList[gCurProblemId];
//  var caption = " " + String(Number(gCurProblemId) + 1) + "/" + gCurProgmeIdList.length + "  ";
  var caption = SectionTitle(gCurSectionId) + "      " +((gCurProblemId) + 1) + "/" + gCurProgmeIdList.length + "     ";
  caption += gCurProblem.caption;
  Say("perform_caption", caption);
}
/*----------------------------------------------------------------------------------------
 ☆★ Send Next ★☆

 Returns whether next exists.
----------------------------------------------------------------------------------------*/
function Dequeue(){
  if(gQueue.length == 0 && !gCurHold) return false;

  if(gQueue.length > 0){
    gCurMino = gQueue.shift();
  }else{
    gCurMino = gCurHold;
    gCurHold = null;
  }
  gCurGuide = gGuidesQueue.shift();
  gCurDir = INITIAL_DIR;
  gCurX = INITIAL_X;
  gCurY = INITIAL_Y;

  gNdCount = NATURAL_DROP_SPAN;
  RefreshHint();
  return true;
}
/*----------------------------------------------------------------------------------------
 ☆★ Refresh hint display ★☆
----------------------------------------------------------------------------------------*/
function RefreshHint(){
  var hint = gCurProblem.hint;
  if(gCurGuide && (gCurProblem.useGuide || gCurUseGuideFlg)){
    hint += '\n(Please Follow The Guide Placements)';
  }
  Say('perform_hint', hint);
}
/*----------------------------------------------------------------------------------------
 ☆★ Section name description ★☆
----------------------------------------------------------------------------------------*/
function RefreshSectionTitle(){
  Say('section_title', SectionTitle(gCurSectionId));
}
/*----------------------------------------------------------------------------------------
 ☆★ Clear status is refreshed on the button ★☆
----------------------------------------------------------------------------------------*/
function RefreshProblemButtons(){
  for(var i = 0; i < SECTION_NUM; i++){
    if(gProblemsCleared[i])  ShowImage('clear'+ i);

  }
}
/*----------------------------------------------------------------------------------------
 ☆★Scene: Section selection ★☆
----------------------------------------------------------------------------------------*/
function SceneSelectSection(){
  switch(gButton){
  case 'preferences':
    gScene = 'preferences';
    return;
  }
  if(gButton.match(/^section[0-9]+$/)){
    gCurSectionId = parseInt(gButton.substring(7)) - 1;
    gCurProblemId = 0;

    switch(gButton){
    case 'section1':  /* Let's create a template */
      gCurProgmeIdList = getProblemIdList(WARMING_UP);
      break;
    case 'section2':  /* I Vertical (with guide) */
      gCurProgmeIdList = getProblemIdList(GUIDANCE_VERTICAL);
      break;
    case 'section3':  /* I Vertical Random 30 questions */
      gCurProgmeIdList = (shuffle(getProblemIdList(PROB840_VERTICAL))).slice(0,20);
      break;
    case 'section4':  /* First move I Mino 1st row (with guide) */
      gCurProgmeIdList = getProblemIdList(GUIDANCE_HORIZONTAL_1);
      break;
    case 'section5':  /* First move I Mino 1st row */
      gCurProgmeIdList = (shuffle(getProblemIdList(PROB840_HORIZONTAL_1))).slice(0,20);
      break;
    case 'section6':  /* Lay everything down (with guide) */
      gCurProgmeIdList = getProblemIdList(GUIDANCE_HORIZONTAL_LAYDOWN);
      break;
    case 'section7':  /* Lay everything down */
      gCurProgmeIdList = (shuffle(getProblemIdList(PROB840_HORIZONTAL_LAYDOWN))).slice(0,20);
      break;
    case 'section8':  /* IILO (with guide) */
      gCurProgmeIdList = getProblemIdList(GUIDANCE_HORIZONTAL_IILO);
      break;
    case 'section9':  /* IILO */
      gCurProgmeIdList = (shuffle(getProblemIdList(PROB840_HORIZONTAL_IILO))).slice(0,10);
      break;
    case 'section10':  /* First move I Mino 3rd row (with guide) */
      gCurProgmeIdList = getProblemIdList(GUIDANCE_HORIZONTAL_3);
      break;
    case 'section11':  /* First move I, 3rd row of mino */
      gCurProgmeIdList = (shuffle(getProblemIdList(PROB840_HORIZONTAL_3))).slice(0,20);
      break;
    case 'section12':  /* Midterm test 20 questions */
      var array1 = shuffle(getProblemIdList(PROB840_HORIZONTAL_1));
      var array2 = shuffle(getProblemIdList(PROB840_HORIZONTAL_LAYDOWN));
      var array3 = shuffle(getProblemIdList(PROB840_HORIZONTAL_IILO));
      var array4 = shuffle(getProblemIdList(PROB840_HORIZONTAL_3));
      gCurProgmeIdList = (shuffle(((array1.concat(array2)).concat(array3)).concat(array4))).slice(0,20);
      break;
    case 'section13':  /* LSIO (with guide)*/
      gCurProgmeIdList = getProblemIdList(GUIDANCE_LSIO);
      break;
    case 'section14':  /* LSIO  */
      gCurProgmeIdList = shuffle(getProblemIdList(PROB840_LSIO));
      break;
    case 'section15':  /* Final exam 30 questions */
      gCurProgmeIdList = (shuffle(getProblemIdList(PROB840))).slice(0,30);
      break;
    case 'section16':  /* Graduation test */
      var array1 = (shuffle(getProblemIdList(PROB840))).slice(0,50);
      var array2 = (shuffle(getProblemIdList(PROB840_MIRROR))).slice(0,50);
      gCurProgmeIdList = shuffle(array1.concat(array2));
      break;
    case 'section17':  /* Other Clear Methods */
      gCurProgmeIdList = getProblemIdList(GUIDANCE_OTHER_WISE);
      break;
    case 'section18':  /* Other ways to erase */
      gCurProgmeIdList = shuffle(getProblemIdList(PROB840_VERTICAL));
      break;
    case 'section19':  /* I Horizontal Random 196 questions */
      var array1 = shuffle(getProblemIdList(PROB840_HORIZONTAL_1));
      var array2 = shuffle(getProblemIdList(PROB840_HORIZONTAL_LAYDOWN));
      var array3 = shuffle(getProblemIdList(PROB840_HORIZONTAL_IILO));
      var array4 = shuffle(getProblemIdList(PROB840_HORIZONTAL_3));
      gCurProgmeIdList = shuffle(((array1.concat(array2)).concat(array3)).concat(array4));
      break;
    case 'section20':  /* All 711 Questions */
      gCurProgmeIdList = shuffle(getProblemIdList(PROB840));
      break;
    case 'section21':  /* All 711 Questions Mirrored */
      gCurProgmeIdList = shuffle(getProblemIdList(PROB840_MIRROR));
      break;
    default:
      gCurProgmeIdList = [];/* When you enter here, the screen should turn white and appear to crash */
      break;
    }

    gScene = 'perform';
  }
}

/*----------------------------------------------------------------------------------------
 ☆★ Scene: Lesson begins ★☆
----------------------------------------------------------------------------------------*/
function ScenePerform(){
  switch(gButton){
  case 'back':
    gScene = 'select_section';
    return;
  }
  if(IsPressed()) gScene = 'perform_falling';
}
/*----------------------------------------------------------------------------------------
 ☆★ Scene: During lesson ★☆
----------------------------------------------------------------------------------------*/
function ScenePerformFalling(){
  switch(gButton){
  case 'back':
    gScene = 'select_section';
    return;
  }
  // Displaying the skill name
  if(gDfCount > 0){
    gDfCount--;
    // Return the display when the count ends
    if(gDfCount == 0) DisplayCaption();
  }
  // Clearing line
  if(gLineClearCount > 0){
    gLineClearCount--;
    if(gLineClearCount == 0){
      var caption = (gCurSectionId + 1) + "-" + (gCurProblemId + 1) + " ";
      caption += gCurProblem.caption;
      RemoveReservedLines()
    }
    // Do not perform any other operations
    return;
  }
  // If no mino is being operated
  if(!gCurMino){
    // Check if cleared
    if(ReqIsCleared()) gScene = 'perform_cleared';
    // Send next. If there is no next, fail.
    else if(!Dequeue()){
      gCurMino = null;
      gScene = 'perform_failed';
    }
    // Lockout check
    if(AppearsToLockout()){
      Lockout();
      return;
    }
  // If you are manipulating a mino
  }else{
    // Branch by key input
    if(InputsHorizontalMove(true) == 0){
      if(PlaceTest(gCurDir, gCurMino, gCurX + 1, gCurY)){
        gCurX++;
        gTSpinType = 0;
        if(IsLanding()) gNdCount = NATURAL_DROP_SPAN;
      }
    }else if(InputsHorizontalMove(true) == 2){
      while(PlaceTest(gCurDir, gCurMino, gCurX + 1, gCurY)){
        gCurX++;
        gTSpinType = 0;
        if(IsLanding()) gNdCount = NATURAL_DROP_SPAN;
      }
    }else if(InputsHorizontalMove(false) == 0){
      if(PlaceTest(gCurDir, gCurMino, gCurX - 1, gCurY)){
        gCurX--;
        gTSpinType = 0;
        if(IsLanding()) gNdCount = NATURAL_DROP_SPAN;
      }
    }else if(InputsHorizontalMove(false) == 2){
      while(PlaceTest(gCurDir, gCurMino, gCurX - 1, gCurY)){
        gCurX--;
        gTSpinType = 0;
        if(IsLanding()) gNdCount = NATURAL_DROP_SPAN;
      }
    }
    if(InputsSoftDrop()) SoftDrop();
    if(IsPressed(KeyRR())) RotateRight();
    if (IsPressed(KeyRL())) RotateLeft();
    if (IsPressed(KeyR180())) Rotate180();
    if(IsPressed(KeyG()) && !(gCurProblem.useGuide || gCurUseGuideFlg)) {
      gScene = 'perform_guide';
    }
    if(IsPressed(KeyH())) Hold();
    if(IsPressed(KeyHD())) HardDrop();  // �n�[�h�h���b�v���͍͂Ō�ɔ��肷�邱��
    // ����/���n����
    if(--gNdCount <= 0){
      gNdCount = NATURAL_DROP_SPAN;
      if(!IsLanding()){
        gCurY++;
        gTSpinType = 0;
        gLandingCount = NATURAL_DROP_SPAN;
      }else{
        // �K�C�h�z��_���v
        if(DUMP_GUIDE_DATA){
          console.log("G(%s, %d, %d, %d)", gCurMino, gCurDir, gCurX, gCurY-3);
        }
        // ���n
        Land();
      }
    }
  }

  Refresh();
}
/*----------------------------------------------------------------------------------------
 ���� ���ړ���^����? ����

 ���ړ��L�[���������ςȂ��ɂ����Ƃ��A���ړ���^����u�Ԃ��𔻒f���ĕԂ��܂��B�����n�߂��u
 �Ԃ�K��̃��s�[�g�Ԋu�� true ��Ԃ��܂��B

----------------------------------------------------------------------------------------*/
function InputsHorizontalMove(toRight){
  keyName = toRight ? KeyR() : KeyL();
  if(PressedDuration(keyName) < HORIZONTAL_CHARGE_DURATION) return IsPressed(keyName) ? 0 : 1;
  if (HORIZONTAL_REPEAT_SPAN == 0) {
    return 2;
  }
  return (PressedDuration(keyName) - HORIZONTAL_CHARGE_DURATION) % HORIZONTAL_REPEAT_SPAN == 0 ? 0 : 1;
}
/*----------------------------------------------------------------------------------------
 ���� �\�t�g�h���b�v���s? ����

 �������u�ԂƁA�ȍ~�\�t�g�h���b�v�Ԋu���o�߂���x�� true ��Ԃ��܂��B
----------------------------------------------------------------------------------------*/
function InputsSoftDrop(){
  if(IsPressed(KeySD())) return true;
  if(!IsHolded(KeySD())) return false;
  return PressedDuration(KeySD()) % SOFT_DROP_SPAN == 0;
}
/*----------------------------------------------------------------------------------------
 ���� ���������C��������Ώ����\�񂷂� ����

 �B�������Z ID ��z��ɂ��ĕԂ��܂��B
----------------------------------------------------------------------------------------*/
function EraseLine(){
  // ���������C���̌���
  var eraseLines = [];
  var lineErases;
  for(var i = 0; i < MATRIX_HEIGHT; i++){
    lineErases = true;
    for(var j = 0; j < MATRIX_WIDTH; j++){
      if(gBlocks[gMatrix[i][j]].passable){
        lineErases = false;
        break;
      }
    }
    if(lineErases){
      eraseLines.push(i);
      // ���C���폜�\��
      ReserveCutLine(i);
    }
  }
  var numEls = eraseLines.length;
  // REN ���Ǘ�
  if(numEls == 0) gRens = -1;
  else gRens++;
  // �B�������Z ID �̔z����쐬
  var features = [];
  switch(numEls){
  case 0:
    if(gTSpinType > 0) features.push(gTSpinType == 1 ? 4 : 5);
    break;
  case 1: features.push([0, 6, 7][gTSpinType]); break;
  case 2: features.push(gTSpinType == 0 ? 1 : 8); break;
  case 3: features.push(gTSpinType == 0 ? 2 : 9); break;
  case 4: features.push(3); break;
  }
  if(numEls >= 1){
    if(gRens >= 1) features.push(100 + gRens);
    if(gIsReadyToB2b && (numEls >= 4 || gTSpinType > 0)) features.push(11);
    if(IsEmptyMatrix()) features.push(10);
  }
  // B2B �t���O�Ǘ�
  if(numEls >= 1) gIsReadyToB2b = (numEls >= 4 || (gTSpinType > 0 && numEls >= 1));

  return features;
}

/*----------------------------------------------------------------------------------------
 ���� �}�g���b�N�X�͋�? ����
----------------------------------------------------------------------------------------*/
function IsEmptyMatrix(){
  for(var i = 0; i < MATRIX_HEIGHT; i++){
    for(var j = 0; j < MATRIX_WIDTH; j++){
      if(!gBlocks[gMatrix[i][j]].passable) return false;
    }
  }
  return true;
}
/*----------------------------------------------------------------------------------------
 ���� ���C�������\�� ����

 <line>�s�ڂɂ���u���b�N���폜�\�񂵂܂��B������ RemoveReservedLines() �ō폜����܂��B
----------------------------------------------------------------------------------------*/
function ReserveCutLine(line){
  for(var i = 0; i < MATRIX_WIDTH; i++){
    gMatrix[line][i] = BlkVanishing().id;
  }
  gLineClearCount = LINE_CLEAR_DURATION;
}
/*----------------------------------------------------------------------------------------
 ���� �����\��ς̃��C������ ����

 �����\��ς̃u���b�N���������A�ł�����Ԃ��ォ��l�߂܂��B
----------------------------------------------------------------------------------------*/
function RemoveReservedLines(){
  for(var i = 0; i < MATRIX_HEIGHT; i++){
    for(var j = 0; j < MATRIX_WIDTH; j++){
      if(gBlocks[gMatrix[i][j]].toVanish){
        for(var k = i; k >= 1; k--){
          gMatrix[k][j] = gMatrix[k - 1][j];
        }
        gMatrix[0][j] = 0;
      }
    }
  }
}
/*----------------------------------------------------------------------------------------
 ���� �Z���擾 ����

 �����̋Z��B�������ꍇ�A�܂Ƃ߂� 1 �̕�����ɂ��ĕԂ��܂��B
----------------------------------------------------------------------------------------*/
function FeatureName(features){
  var result = "☆ ";
  for(var i = 0; i < features.length; i++){
    if(i > 0) result += " ";
    switch(features[i]){
    case  0: result += "SINGLE"; break;
    case  1: result += "DOUBLE"; break;
    case  2: result += "TRIPLE"; break;
    case  3: result += "TETRiS"; break;
    case  4: result += "T-SPIN MINI"; break;
    case  5: result += "T-SPIN"; break;
    case  6: result += "T-SPIN SINGLE MINI"; break;
    case  7: result += "T-SPIN SINGLE"; break;
    case  8: result += "T-SPIN DOUBLE"; break;
    case  9: result += "T-SPIN TRIPLE"; break;
    case 10: result += "PERFECT CLEAR"; break;
    case 11: result += "BACK to BACK"; break;
    default: result += (features[i] - 100) + " REN"; break;  // 100 + n: n REN
    }
  }
  result += " ☆";
  return result;
}
/*----------------------------------------------------------------------------------------
 ���� �ڒn��? ����
----------------------------------------------------------------------------------------*/
function IsLanding(){
  return !PlaceTest(gCurDir, gCurMino, gCurX, gCurY + 1);
}
/*----------------------------------------------------------------------------------------
 ���� ���n ����
----------------------------------------------------------------------------------------*/
function Land(){
  // �t�B�[���h�ɔ��f
  for(var i = 0; i < 4; i++){
    for(var j = 0; j < 4; j++){
      if(IsValidPos(j + gCurX, i + gCurY)){
        if(gCurMino.shape[gCurDir][i][j] == 1){
          gMatrix[i + gCurY][j + gCurX] = gCurMino.placedBlockId;
        }
      }
    }
  }
  // �����ȃK�C�h�Ȃ�]��Ȃ��Ǝ��s��
  if(gCurGuide){
    if((gCurProblem.useGuide || gCurUseGuideFlg) && GuideBlocksPos().join() != CurMinoBlocksPos().join()){
      gScene = 'perform_failed';
      gCurMino = null;
      return;
    }
  }
  // ���b�N�A�E�g����
  if(LandsToLockout()){
    Lockout();
    return;
  }
  // �Z���������Ă���Ε\������я���
  var features = EraseLine();
  if(features.length > 0){
    // �\���Ǘ�
    Say('perform_caption', FeatureName(features));
    gDfCount = DISPLAY_FEATURES_DURATION;
    // �m���}�֔��f
    RemoveReq(features);
    // ���C���������Ă���΃��C������
    if(IsErased(features)) gLineClearCount = LINE_CLEAR_DURATION;
  }
  // �A�N�e�B�u�~�m����
  gCurMino = null;
}
/*----------------------------------------------------------------------------------------
 ���� ���n�������ʁA���b�N�A�E�g? ����

 �~�m�̑S�u���b�N���f�b�h���C������ɂȂ����ꍇ�� true ��Ԃ��܂��B
----------------------------------------------------------------------------------------*/
function LandsToLockout(){
  var minoPos = MinoToBlockPositions(gCurDir, gCurMino, gCurX, gCurY);
  for(var i = 0; i < minoPos.length; i++){
    if(minoPos[i][1] >= DEADLINE_HEIGHT) return false;
  }
  return true;
}
/*----------------------------------------------------------------------------------------
 ���� �~�m���o���������ʁA���b�N�A�E�g? ����

 �~�m�̃u���b�N�Ɗ����̃u���b�N�̈ʒu�� 1 �ł��d�������� true ��Ԃ��܂��B
----------------------------------------------------------------------------------------*/
function AppearsToLockout(){
  if(!gCurMino) return;
  return !PlaceTest(INITIAL_DIR, gCurMino, INITIAL_X, INITIAL_Y);
}
/*----------------------------------------------------------------------------------------
 ���� ���b�N�A�E�g������ ����
----------------------------------------------------------------------------------------*/
function Lockout(){
  gScene = 'perform_failed';
  gCurMino = null;
}
/*----------------------------------------------------------------------------------------
 ���� ���C����������? ����
----------------------------------------------------------------------------------------*/
function IsErased(features){
  for(var i = 0; i < features.length; i++){
    switch(features[i]){
    case  0:
    case  1:
    case  2:
    case  3:
    case  6:
    case  7:
    case  8:
    case  9:
    case 10:
    case 11:
      return true;
    }
  }
  return false;
}
/*----------------------------------------------------------------------------------------
 ���� �K�C�h�̃u���b�N��������W�̈ꗗ���擾 ����
----------------------------------------------------------------------------------------*/
function GuideBlocksPos(){
  var g = gCurGuide;
//  return MinoToBlockPositions(g.dir, gCurMino, g.x, g.y + DEADLINE_HEIGHT);
  return MinoToBlockPositions(g.dir, g.mino, g.x, g.y + DEADLINE_HEIGHT);
}
/*----------------------------------------------------------------------------------------
 ���� ���쒆�̃~�m�̃u���b�N��������W�̈ꗗ���擾 ����
----------------------------------------------------------------------------------------*/
function CurMinoBlocksPos(){
  return MinoToBlockPositions(gCurDir, gCurMino, gCurX, gCurY);
}
/*----------------------------------------------------------------------------------------
 ���� �w��ʒu�Ƀ~�m��u�����Ƃ��̃u���b�N�̍��W�̈ꗗ���擾 ����

 �傫�� 2 �̔z�� [ x ���W, y ���W] �̈ꗗ������ɔz��ɂ��ĕԂ��܂�(������ 2 �����z��)�B
----------------------------------------------------------------------------------------*/
function MinoToBlockPositions(dir, mino, x, y){
  var result = [];
  for(var i = 0; i < 4; i++){
    for(var j = 0; j < 4; j++){
      if(mino.shape[dir][i][j] == 1) result.push([x + j, y + i]);
    }
  }
  return result;
}
/*----------------------------------------------------------------------------------------
 ���� �n�[�h�h���b�v������� Y ���ǂꂾ������( DIFFerence of Y )���邩���擾 ����
----------------------------------------------------------------------------------------*/
function HarddropDiffY(){
  var i = 0;
  while(PlaceTest(gCurDir, gCurMino, gCurX, gCurY + i)){
    i++;
  }
  // �ʉߕs�\�ɂȂ钼�O�̓_�܂ł̑����ʂ�Ԃ�
  return i - 1;
}
/*----------------------------------------------------------------------------------------
 ���� �n�[�h�h���b�v ����
----------------------------------------------------------------------------------------*/
function HardDrop(){
  var dY = HarddropDiffY();
  if(dY > 0) gTSpinType = 0;
  gCurY += dY;
  gNdCount = 0;
  gLandingCount = 0;
}
/*----------------------------------------------------------------------------------------
 ���� �\�t�g�h���b�v ����
----------------------------------------------------------------------------------------*/
function SoftDrop(){
  while(!IsLanding()){
    gCurY++;
    gTSpinType = 0;
    gNdCount = NATURAL_DROP_SPAN;
  }
}
/*----------------------------------------------------------------------------------------
 ���� �z�[���h ����
----------------------------------------------------------------------------------------*/
function Hold(){
  if(gQueue.length == 0 && !gCurHold) return;

  if(!gCurHold){
    gCurHold = gCurMino;
    gCurMino = gQueue.shift();
  }else{
    var mino = gCurHold;
    gCurHold = gCurMino;
    gCurMino = mino;
  }

  gCurDir = INITIAL_DIR;
  gCurX = INITIAL_X;
  gCurY = INITIAL_Y;
  gTSpinType = 0;
  gNdCount = NATURAL_DROP_SPAN;

}
/*----------------------------------------------------------------------------------------
 ���� �B�������Z�ɉ����ăm���}( REQuired features )�����炷 ����
----------------------------------------------------------------------------------------*/
function RemoveReq(features){
  var index;
  for(var i = 0; i < features.length; i++){
    index = (features[i] > 100) ? 12 : features[i];
    gCurProblemReq[index]--;
    // T �X�s���Ȃ�ʏ�̏������̃m���}�����炷�B���Ƃ��� TST �Ȃ�g���v���̃m���}�����炷
    switch(index){
    case 6:
    case 7:
      gCurProblemReq[0]--;
      break;
    case 8:
      gCurProblemReq[1]--;
      break;
    case 9:
      gCurProblemReq[2]--;
      break;
    }
  }
}
/*----------------------------------------------------------------------------------------
 ���� �m���}�N���A? ����
----------------------------------------------------------------------------------------*/
function ReqIsCleared(){
  for(var i = 0; i < gCurProblemReq.length; i++){
    if(gCurProblemReq[i] > 0) return false;
  }
  return true;
}
/*----------------------------------------------------------------------------------------
 ���� �w����W�Ƀ~�m��u����? ����
----------------------------------------------------------------------------------------*/
function PlaceTest(dir, mino, x, y){
  var block;
  for(var i = 0; i < 4; i++){
    for(var j = 0; j < 4; j++){
      if(IsValidPos(x + j, y + i)){
        block = gBlocks[gMatrix[y + i][x + j]];
        if(mino.shape[dir][i][j] == 1 && !block.passable) return false;
      }else{
        // �����ȏꏊ�Ńf�b�h���C������ȊO�Ȃ�u���Ȃ�
        if(mino.shape[dir][i][j] == 1 &&
                (x + j < 0 || MATRIX_WIDTH <= x + j || MATRIX_HEIGHT <= y + i)){
          return false;
        }
      }
    }
  }
  return true;
}
/*----------------------------------------------------------------------------------------
 ���� �w����W�͔z��͈͓̔�? ����
----------------------------------------------------------------------------------------*/
function IsValidPos(x, y){
  return (0 <= x && x < MATRIX_WIDTH && 0 <= y && y < MATRIX_HEIGHT);
}
/*----------------------------------------------------------------------------------------
 ���� ��ʏ�Ƀ~�m��`�� ����
----------------------------------------------------------------------------------------*/
function DisplayMino(dir, mino, x, y, blockId){
  var block;  // 0=��, 1=����

  for(var i = 0; i < 4; i++){
    for(var j = 0; j < 4; j++){
      DisplayBlock(x + j, y + i, mino.shape[dir][i][j] * blockId, true);
    }
  }
}
/*----------------------------------------------------------------------------------------
 ���� �u���b�N�̕`�� ����

 �}�g���b�N�X��̍��W(<x>, <y>)�� ID ��<blockId>�̃u���b�N��`�悵�܂��B <ignoresZero>��
 true ���w�肷��ƁAID �� 0 �̃u���b�N��`�悵�܂���(�����Ƃ��Ĉ���)�B
----------------------------------------------------------------------------------------*/
function DisplayBlock(x, y, blockId, ignoresZero){
  if(ignoresZero && blockId == 0) return;
  if(CanDisplayPos(x, y)){
     SetImage("m" + (y - DEADLINE_HEIGHT) + "_" + x, gBlocks[blockId].cache.src);
  }
}
/*----------------------------------------------------------------------------------------
 ���� �ʍs��? ����
----------------------------------------------------------------------------------------*/
function IsPassable(x, y){
  if(x < 0 || MATRIX_WIDTH <= x || MATRIX_HEIGHT <= y) return false;
  if(y < 0) return true;
  return gBlocks[gMatrix[y][x]].passable;
}
/*----------------------------------------------------------------------------------------
 ���� �\������? ����
----------------------------------------------------------------------------------------*/
function CanDisplayPos(x, y){
  return (0 <= x && x < MATRIX_WIDTH && DEADLINE_HEIGHT <= y && y < MATRIX_HEIGHT);
}
/*----------------------------------------------------------------------------------------
 ☆★ Right rotation ★☆
----------------------------------------------------------------------------------------*/
function RotateRight(){
  Rotate(true);
}
/*----------------------------------------------------------------------------------------
 ☆★ Left rotation ★☆
----------------------------------------------------------------------------------------*/
function RotateLeft(){
  Rotate(false);
}
// function Rotate180() {
//     RotateRight();
//     RotateRight();
// }
/*----------------------------------------------------------------------------------------
 ☆★ Rotation ★☆

 If <toRight> is true, it rotates right; if it is false, it rotates left.
----------------------------------------------------------------------------------------*/
function Rotate(toRight){
  var newDir = (gCurDir + (toRight ? 1 : 3)) % 4;
  var rotRule = gCurMino.rotationRule;
  var newX, newY;
  var rotateRuleId;
  // Test the rotation rules. If successful, apply them.
  var canRotate = false;
  for(var i = 0; i < ROTATE_RULES; i++){
    newX = gCurX + rotRule.dx[toRight ? 0 : 1][gCurDir][i];
    newY = gCurY + rotRule.dy[toRight ? 0 : 1][gCurDir][i];
    if(PlaceTest(newDir, gCurMino, newX, newY)){
      gCurX = newX;
      gCurY = newY;
      gCurDir = newDir;
      canRotate = true;
      rotateRuleId = i;
      break;
    }
  }
  if(canRotate){
    SetTSpinType(i);
    if(IsLanding()) gNdCount = NATURAL_DROP_SPAN;
  }
}

function Rotate180(){
  var newDir = (gCurDir + 2) % 4;
  var rotRule = gCurMino.rotationRule;
  var newX, newY;
  var rotateRuleId;
  // Test the rotation rules. If successful, apply them.
  var canRotate = false;
  for(var i = 0; i < ROTATE_RULES; i++){
    newX = gCurX - rotRule.dx[2][gCurDir][i];
    newY = gCurY - rotRule.dy[2][gCurDir][i];
    if(PlaceTest(newDir, gCurMino, newX, newY)){
      gCurX = newX;
      gCurY = newY;
      gCurDir = newDir;
      canRotate = true;
      rotateRuleId = i;
      break;
    }
  }
  if(canRotate){
    SetTSpinType(i);
    if(IsLanding()) gNdCount = NATURAL_DROP_SPAN;
  }
}

/*----------------------------------------------------------------------------------------
 ���� T-SPIN �������� ����

 T-SPIN �s�����Ȃ� 0�AT-SPIN MINI �Ȃ� 1�AT-SPIN �Ȃ� 2 ��Ԃ��܂��B
//----------------------------------------------------------------------------------------
 ��]�����̒��Ŏ擾���Ă��������B
 ���̏����𖞂����� T-SPIN �ɂȂ�܂��B
 �E T �~�m�ł��邱��
 �E�Ō�ɐ����������삪��]�ł���(���̊֐����Ăяo���O��)
 �E�ʕ��̎��� 4 �u���b�N( �� �� �~ �̕���)�̂��� 3 �ӏ��ȏ�Ƀu���b�N������

 ����Ɏ��̏����̂ǂ��炩�𖞂����� T-SPIN �ɁA�������Ȃ��� T-SPIN MINI �ɂȂ�܂��B
 �E�ʕ��̗���( �� �̕���)�� 2 �ӏ��Ƃ��u���b�N������
 �E���O�̉�]���� 5 ���( TST ���̉�]�A�u T-SPIN FIN �v��)�ł���

 �������@�~�����@�~�@�~�@�����~
 �������@�@�����@�������@����
 �~�@�~�@�~�����@�������@�����~

 ��]�ȊO�̑��삪���������Ƃ��� T-SPIN �t���O gTSpinType �� 0 �ɂ��Ă��������B
//----------------------------------------------------------------------------------------
 �ׂ��������̓\�t�g�ɂ���ĈقȂ�悤�ł��B�Ƃ肠�����A�ǏR��⊊�荞�݂� T-SPIN �� MINI
 �Ɣ��肳��Ă���Ηǂ��Ǝv���܂��B
----------------------------------------------------------------------------------------*/
function SetTSpinType(rotateRuleId){
  if(gCurMino != T) return 0;

  var tsCnt = 0;
  var tssCnt = 0;
  var isBlock = false;
  // TS ��������� TSS �����̉��ӏ��ɒʍs�s�u���b�N�����邩
  for(var i = 0; i < T.shape[gCurDir].length; i++){
    for(var j = 0; j < T.shape[gCurDir][i].length; j++){
      if(IsValidPos(j + gCurX, i + gCurY)){
        isBlock = !gBlocks[gMatrix[i + gCurY][j + gCurX]].passable;
      }else{
        isBlock = true;
      }
      if(isBlock){
        if(gTsTiles[gCurDir][i][j] > 0) tsCnt++;
        if(gTssTiles[gCurDir][i][j] > 0) tssCnt++;
      }
    }
  }
  // TSS �� TSM ���̔���
  if(tsCnt >= 3){
    gTSpinType = (tssCnt >= 2 || rotateRuleId == 4) ? 2 : 1;
  }else{
    gTSpinType = 0;
  }
}
/*----------------------------------------------------------------------------------------
 ���� �\���𔽉f ����
----------------------------------------------------------------------------------------*/
function Refresh(){
  RefreshMatrix();
  RefreshQueue();
  RefreshHold();
}
/*----------------------------------------------------------------------------------------
 ���� �}�g���b�N�X���f ����
----------------------------------------------------------------------------------------*/
function RefreshMatrix(){
  RefreshPlacedMino();
  RefreshGhostAndGuide();
  RefreshActiveMino();
}
/*----------------------------------------------------------------------------------------
 ���� �ݒu�σu���b�N���f ����
----------------------------------------------------------------------------------------*/
function RefreshPlacedMino(){
  for(var i = DEADLINE_HEIGHT; i < MATRIX_HEIGHT; i++){
    for(var j = 0; j < MATRIX_WIDTH; j++){
      SetImage("m" + (i - DEADLINE_HEIGHT) + "_" + j, gBlocks[gMatrix[i][j]].image);
    }
  }
}
/*----------------------------------------------------------------------------------------
 ���� �������~�m���f ����
----------------------------------------------------------------------------------------*/
function RefreshActiveMino(){
  if(gCurMino) DisplayMino(gCurDir, gCurMino, gCurX, gCurY, gCurMino.activeBlockId);
}
/*----------------------------------------------------------------------------------------
 ���� �S�[�X�g�~�m�ƃK�C�h�~�m���f ����
----------------------------------------------------------------------------------------*/
function RefreshGhostAndGuide(){
  if(!gCurMino) return;
  var ghostBlks = MinoToBlockPositions(gCurDir, gCurMino, gCurX, gCurY + HarddropDiffY());
  // �S�[�X�g�~�m�̕`��
  for(var i = 0; i < ghostBlks.length; i++){
    DisplayBlock(ghostBlks[i][0], ghostBlks[i][1], gCurMino.ghostBlockId, true);
  }

  var g = gCurGuide;
  if(!g) return;
  var guideBlks = MinoToBlockPositions(g.dir, g.mino, g.x, g.y + DEADLINE_HEIGHT);
  // ���ʕ����̒T��
  var ghostGuideBlks = [];
  for(var i = 0; i < ghostBlks.length; i++){
    for(var j = 0; j < guideBlks.length; j++){
      if(ghostBlks[i][0] == guideBlks[j][0] && ghostBlks[i][1] == guideBlks[j][1]){
        ghostGuideBlks.push([ghostBlks[i][0], ghostBlks[i][1]]);
      }
    }
  }

  // �K�C�h�~�m�̕`��
  if(gCurProblem.useGuide || gCurUseGuideFlg){
    for(var i = 0; i < guideBlks.length; i++){
      DisplayBlock(guideBlks[i][0], guideBlks[i][1], g.mino.guideBlockId, true);
    }

    // ���ʕ����̕`��
    for(var i = 0; i < ghostGuideBlks.length; i++){
      DisplayBlock(ghostGuideBlks[i][0], ghostGuideBlks[i][1], String(g.mino.ghostGuideBlockId) + String(gCurMino.id), true);
    }
  }
}
/*----------------------------------------------------------------------------------------
 ���� �l�N�X�g���f ����

 ��( 0 )���ړ����̃u���b�N( 11 �` 17 )�̉摜��\�����܂��B1 �}�X���ɂ��炵�܂��B
----------------------------------------------------------------------------------------*/
function RefreshQueue(){
  var mino;
  var filename;
  var i = 0;
  while(i < Math.min(gQueue.length, NEXT_MINOS)){
    mino = gQueue[i];
    for(var j = 0; j < 3; j++){
      for(var k = 0; k < 4; k++){
        SetImage("n" + i + "_" + (j + 1) + "_" + k,
                 gBlocks[mino.shape[0][j][k] * mino.activeBlockId].cache.src);
      }
    }
    i++;
  }
  // ��
  while(i < NEXT_MINOS){
    for(var j = 0; j < 4; j++){
      for(var k = 0; k < 4; k++){
        SetImage("n" + i + "_" + j + "_" + k, gBlocks[0].cache.src);
      }
    }
    i++;
  }
}
/*----------------------------------------------------------------------------------------
 ���� �z�[���h���f ����

 ��( 0 )���ړ����̃u���b�N( 11 �` 17 )�̉摜��\�����܂��B1 �}�X���ɂ��炵�܂��B
----------------------------------------------------------------------------------------*/
function RefreshHold(){
  var mino;

  mino = gCurHold;
  if(mino){
    for(var j = 0; j < 3; j++){
      for(var k = 0; k < 4; k++){
        SetImage("h" + (j + 1) + "_" + k,
                 gBlocks[mino.shape[0][j][k] * mino.activeBlockId].cache.src);
      }
    }
  }else{
    // ��
    for(var j = 0; j < 4; j++){
      for(var k = 0; k < 4; k++){
        SetImage("h" + j + "_" + k, gBlocks[0].cache.src);
      }
    }
  }

}
/*----------------------------------------------------------------------------------------
 ���� �V�[��: ���b�X�����s ����
----------------------------------------------------------------------------------------*/
function ScenePerformFailed(){
  switch(gButton){
  case 'back':
    gScene = 'select_section';
    return;
  }
  if(IsPressed()) gScene = 'perform';
}
/*----------------------------------------------------------------------------------------
 ���� �V�[��: �K�C�h���[�h ����
----------------------------------------------------------------------------------------*/
function ScenePerformGuideMode(){
  switch(gButton){
  case 'back':
    gScene = 'select_section';
    return;
  }
  if(IsPressed()) gScene = 'perform';
}
/*----------------------------------------------------------------------------------------
 ���� �V�[��: �N���A ����
----------------------------------------------------------------------------------------*/
function ScenePerformCleared(){
  switch(gButton){
  case 'back':
    gScene = 'select_section';
    return;
  }
  if(IsPressed()) AfterClear();
}
/*----------------------------------------------------------------------------------------
 ���� �N���A��̃L�[���� ����

 �u���10�v�Ȃ�΃Z�N�V�����ꗗ�ցA����ȊO�Ȃ玟�̖��ɐi�݂܂��B
----------------------------------------------------------------------------------------*/
function AfterClear(){
  if(gCurProblemId >= gCurProgmeIdList.length - 1){
    gScene = 'select_section';
    gProblemsCleared[gCurSectionId] = true;
    Save('Prg' + gCurSectionId, '1');
  }
  else{
    gCurProblemId++;
    gScene = 'perform';
  }
}
/*----------------------------------------------------------------------------------------
 ���� �e�L�[���̎擾 ����
----------------------------------------------------------------------------------------*/
function KeyL() {return gKeys[0]; }  // move Left
function KeyR() {return gKeys[1]; }  // move Right
function KeySD(){return gKeys[2]; }  // SoftDrop
function KeyHD(){return gKeys[3]; }  // HardDrop
function KeyRR(){return gKeys[4]; }  // Rotate Right
function KeyRL(){return gKeys[5]; }  // Rotate Left
function KeyH() {return gKeys[6]; }  // Hold
function KeyG() { return gKeys[7]; }  // Guide
function KeyR180() { return gKeys[8];}
/*----------------------------------------------------------------------------------------
 ���� �V�[��: �ݒ� ����
----------------------------------------------------------------------------------------*/
function ScenePreferences(){
  switch(gButton){
  case 'ok':
    if(SavePreferences()) gScene = 'select_section';
    break;
  case 'cancel':
    gScene = 'select_section';
    break;
  }
}
/*----------------------------------------------------------------------------------------
 ���� �ݒ�̕ۑ� ����

 �ۑ��������������ǂ�����Ԃ��܂��B
----------------------------------------------------------------------------------------*/
function SavePreferences(){
  // �d���s��
  if(KeyDuplicates()){
    alert("Duplicate Key Detected");
    return false;
  }
  // �ݒ蔽�f
  for(var i = 0; i < gKeys.length; i++){
    gKeys[i] = document.getElementById(gSelectForms[i]).value;
  }
  // �N�b�L�[�ɕۑ�
  Save('MoveLeft', gKeys[0]);
  Save('MoveRight', gKeys[1]);
  Save('SoftDrop', gKeys[2]);
  Save('HardDrop', gKeys[3]);
  Save('RotateRight', gKeys[4]);
  Save('RotateLeft', gKeys[5]);
  Save('Hold', gKeys[6]);
  Save('Guide', gKeys[7]);
  Save('Rotate180', gKeys[8]);
  return true;
}
/*----------------------------------------------------------------------------------------
 ���� �L�[���d��? ����

 �e�Z���N�g�{�b�N�X���m�F���āA�d�������邩�ǂ����𔻒肵�ĕԂ��܂��B
----------------------------------------------------------------------------------------*/
function KeyDuplicates(){
  var target1, target2;
  for(var i = 0; i < gSelectForms.length; i++){
    target1 = document.getElementById(gSelectForms[i]).value;
    for(var j = i + 1; j < gSelectForms.length; j++){
      target2 = document.getElementById(gSelectForms[j]).value;
      if(target1 == target2) return true;
    }
  }
  return false;
}
