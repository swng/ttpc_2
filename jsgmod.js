/*========================================================================================
 □■ jsgmod.js (JavaScript Game MODule) ■□
 
 This module supports frame management, key input, etc.
==========================================================================================
/*----------------------------------------------------------------------------------------
 ☆★ List of constants ★☆
----------------------------------------------------------------------------------------*/
var FPS = 30; // Frames Per Second; Number of frames per second
var LOOP_INTERVAL = 17; // <milliseconds> Main loop start interval. Must be less than (1000 / <FPS>)
var KEY_CHARGE_DURATION = 7; // <frames> Number of frames before key repeat begins
var KEY_REPEAT_SPAN = 2; // <frames> Number of frames until next key repeat
/*
● Key Repeat
 When you hold down a key, the key is input continuously. This is called "key repeat." For example,
 If you set KEY_CHARGE_DURATION = 20, KEY_REPEAT_SPAN = 4, the frame where you start pressing the key and the frame where you press the key will be
 Sends input when pressed for frames 20, 24, 28, 32, … (when IsInputting is true)
 (returns
*/
/*----------------------------------------------------------------------------------------
 ☆★How to use★☆

 This is a module that controls frames using Javascript. This module is loaded from Setup() (at startup).
 Please define Main() (initialization process that is executed only once) and Main() (process that is executed every frame).
 Also, call Execute() from the body tag's onLoad event.

Example of HTML file source
 <html>
  <head>
   <script type="text/javascript" src="jsgmod.js"></script>
   <script type="text/javascript" src="my_sccript.js"></script>
  </head>
  <body onLoad="Execute()">
   This article
  </body>
 </html>

------------------------------------------------------------------------------------------
● Key Control
 PressedDuration(keyName)    How many frames the key has been pressed
 IsPressed(keyName) Is the key pressed?
 IsHolded(keyName) Is the key held down?
 IsInputting(keyName) Is the key providing input?

● Script creation and debugging
 p(value, variableName) Display in console
 InitArg(variable, defaultValue) Gets the defined or default value.

● Indicates
 Say(textBoxName, text) Display text
 SetImage(imageId, src) Display an image

● time
 EHour() Get the elapsed time "hour"
 EMin() Gets the elapsed minute
 ESec() Gets the elapsed time in seconds
 EMSec() Gets the elapsed time in milliseconds
 ETime() Gets the elapsed time in seconds
 EtStr(hLength=2, hDelim=':', mDelim=':', sDelim='', msLength=0)
                                  Convert the elapsed time into a string and get it

● Numerical processing
 Round(n, place=0) Rounds to the specified decimal point
 Floor(n, place=0) Truncates to the specified decimal place
 Ceil(n, place=0) Rounds up to the specified decimal point
 Justify(n) Corrects rounding errors
 Rand(n=0, times=0) Random number generator

Cookies
 Save(name, value, expireDays) Save to cookie
 Load(name) Load from cookie

● Start
 Call Execute() (call it from the onLoad event of the body tag)

● Objects
 Layer
   Show() means
   Hide() Hide
   MoveTo(x, y) Move to the specified position
   MoveBy(dX, dY) Move by a specified amount
   ResizeTo(width, height) Resize
   ResizeBy(dWidth, dHeight) Resize by specifying relative values
   Write(text, overwrites=true) Write text (HTML source)

========================================================================================*/
/*----------------------------------------------------------------------------------------
 ☆★ List of global variables ★☆

 For convenience, these variables are publicly accessible, but their values ​​should not be changed outside of this module.
----------------------------------------------------------------------------------------*/
var gTimer; // Timer for controlling the main loop
var gStartTime;     // 開始時刻
var gFrames; // Number of frames passed
var gInputs; // [~255] The number of frames each key is held down
var gConsole; // Console window
/*----------------------------------------------------------------------------------------
 ☆★ Key press processing ★☆
----------------------------------------------------------------------------------------*/
document.onkeydown = function(e){
  // Mozilla, Opera
  if(e != null){
    keyCode = e.which;
    // Prevent the event from firing
    e.preventDefault();
    e.stopPropagation();
  // Internet Explorer
  } else {
    keyCode = event.keyCode;
    // Prevent the event from firing
    event.returnValue = false;
    event.cancelBubble = true;
  }
  // Reflects "start of pressing a key"
  if(gInputs[keyCode] <= 0) gInputs[keyCode] = 0;
}
/*----------------------------------------------------------------------------------------
 ☆★ Processing when key is released ★☆
----------------------------------------------------------------------------------------*/
document.onkeyup = function(e){
  // Mozilla, Opera
  if(e != null){
    keyCode = e.which;
    // Prevent the event from firing
    e.preventDefault();
    e.stopPropagation();
  // Internet Explorer
  } else {
    keyCode = event.keyCode;
    // Prevent the event from firing
    event.returnValue = false;
    event.cancelBubble = true;
  }
  // Reflection of "key released"
  gInputs[keyCode] = -1;
}
/*----------------------------------------------------------------------------------------
 ☆★ What to do when a window loses focus ★☆

 Clears the keystrokes (so the onkeyup event will no longer fire).
----------------------------------------------------------------------------------------*/
window.onblur = function(){
  gInputs = []; for(var i = 0; i < 256; i++) gInputs.push(-1);
}
/*----------------------------------------------------------------------------------------
 ☆★ How many frames the key is pressed ★☆

 Returns the number of frames the key specified by <keyName> has been pressed. When released, it becomes -1.
 Once you start, counting will start again from 0.
----------------------------------------------------------------------------------------*/
function PressedDuration(keyName){
  return gInputs[ToKc(keyName)];
}
/*----------------------------------------------------------------------------------------
 ☆★ Is the key in input start state? ★☆

 Gets whether the key specified by <keyName> is starting to be pressed. Returns true only in the frame where the key is starting to be pressed.
 If you specify a negative number for <keyName> (default), any key will be detected.
----------------------------------------------------------------------------------------*/
function IsPressed(keyName){
  keyName = InitArg(keyName, -1);
  if(keyName < 0){
    for(i = 0; i < gInputs.length; i++){
      if(gInputs[i] == 1) return true;
    }
    return false;
  }
  return gInputs[ToKc(keyName)] == 1;
}
/*----------------------------------------------------------------------------------------
 ☆★ Key pressed? ★☆

 Gets whether the key specified by <keyName> is pressed. Returns true from when it is pressed until it is released.
 If you specify a negative number for <keyName> (default), any key will be detected.
----------------------------------------------------------------------------------------*/
function IsHolded(keyName){
  keyName = InitArg(keyName, -1);
  if(keyName < 0){
    for(i = 0; i < gInputs.length; i++){
      if(gInputs[i] > 0) return true;
    }
    return false;
  }
  return gInputs[ToKc(keyName)] > 0;
}
/*----------------------------------------------------------------------------------------
 ☆★ Is the key giving input? ★☆

 Gets whether the key specified by <keyName> is input.
 If you specify a negative number for <keyName> (default), any
 It also responds to keys.
----------------------------------------------------------------------------------------*/
function IsInputting(keyName){
  keyName = InitArg(keyName, -1);
  if(keyName < 0){
    for(i = 0; i < gInputs.length; i++){
      if(gInputs[i] == 1) return true;
      if((gInputs[i] - KEY_CHARGE_DURATION - 1) % KEY_REPEAT_SPAN == 0) return true;
    }
    return false;
  }
  var keyCode = ToKc(keyName);
  if(gInputs[keyCode] <= KEY_CHARGE_DURATION) return gInputs[keyCode] == 1;
  return (gInputs[keyCode] - KEY_CHARGE_DURATION - 1) % KEY_REPEAT_SPAN == 0;
}
/*----------------------------------------------------------------------------------------
 ☆★ Convert a string to a key code (TO KeyCode) ★☆

 Returns the code for the key specified in <keyString>. If there is no key corresponding to <keyString>, returns 0.
 Keys that have multiple key codes (for example, the number '0' has key codes 48 and 96 (numeric keypad))
 If , it returns a representative code.
----------------------------------------------------------------------------------------*/
function ToKc(keyString){
  switch(keyString){
  case 'Break':      return   3; break;
  case 'BackSpace':  return   8; break;
  case 'Tab':        return   9; break;
  case 'Enter':      return  13; break;
  case 'Shift':      return  16; break;
  case 'Ctrl':       return  17; break;
  case 'Alt':        return  18; break;
  case 'Pause':      return  19; break;
  case 'Esc':        return  27; break;
  case 'Space':      return  32; break;
  case 'PageUp':     return  33; break;
  case 'PageDown':   return  34; break;
  case 'End':        return  35; break;
  case 'Home':       return  36; break;
  case 'Left':       return  37; break;
  case 'Up':         return  38; break;
  case 'Right':      return  39; break;
  case 'Down':       return  40; break;
  case 'Insert':     return  45; break;
  case 'Delete':     return  46; break;
  case '0':          return  48; break;
  case '1':          return  49; break;
  case '2':          return  50; break;
  case '3':          return  51; break;
  case '4':          return  52; break;
  case '5':          return  53; break;
  case '6':          return  54; break;
  case '7':          return  55; break;
  case '8':          return  56; break;
  case '9':          return  57; break;
  case 'A':          return  65; break;
  case 'B':          return  66; break;
  case 'C':          return  67; break;
  case 'D':          return  68; break;
  case 'E':          return  69; break;
  case 'F':          return  70; break;
  case 'G':          return  71; break;
  case 'H':          return  72; break;
  case 'I':          return  73; break;
  case 'J':          return  74; break;
  case 'K':          return  75; break;
  case 'L':          return  76; break;
  case 'M':          return  77; break;
  case 'N':          return  78; break;
  case 'O':          return  79; break;
  case 'P':          return  80; break;
  case 'Q':          return  81; break;
  case 'R':          return  82; break;
  case 'S':          return  83; break;
  case 'T':          return  84; break;
  case 'U':          return  85; break;
  case 'V':          return  86; break;
  case 'W':          return  87; break;
  case 'X':          return  88; break;
  case 'Y':          return  89; break;
  case 'Z':          return  90; break;
  case 'Windows':    return  91; break;
  case 'Menu':       return  93; break;
  case '*':          return 106; break;
  case '+':          return 107; break;
  case 'F1':         return 112; break;
  case 'F2':         return 113; break;
  case 'F3':         return 114; break;
  case 'F4':         return 115; break;
  case 'F5':         return 116; break;
  case 'F6':         return 117; break;
  case 'F7':         return 118; break;
  case 'F8':         return 119; break;
  case 'F9':         return 120; break;
  case 'F10':        return 121; break;
  case 'F11':        return 122; break;
  case 'F12':        return 123; break;
  case 'NumLock':    return 144; break;
  case 'ScrollLock': return 145; break;
  case ':':          return 186; break;
  case ';':          return 187; break;
  case ',':          return 188; break;
  case '-':          return 189; break;
  case '.':          return 190; break;
  case '/':          return 191; break;
  case '@':          return 192; break;
  case '[':          return 219; break;
  case '¥¥':         return 220; break;
  case ']':          return 221; break;
  case '^':          return 222; break;
  default:           return   0; break;
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ Show on console ★☆

 Displays the contents of <value> in the console. If you specify a variable name as a string in <variableName>, the variable name
 This makes it easier to see because it is clearly indicated.

 var a = [1, 2, 3];
 p(a);       // => 1,2,3
 p(a, "a");  // => <a> = 1,2,3
----------------------------------------------------------------------------------------*/
function p(value, variableName){
  // If the console is not open, open it.
  if(typeof gConsole === 'undefined') openConsole();
  else if(gConsole.closed) openConsole();
  // Convert the string
  value = "" + value; // Text serialization
  value = value.replace(/</g, '&lt;');
  value = value.replace(/>/g, '&gt;');
  if(typeof variableName !== 'undefined'){
    variableName = "" + variableName; // Text columnization
    variableName = variableName.replace(/</g, '&lt;');
    variableName = variableName.replace(/>/g, '&gt;');
  }
  // Display in console
  if(typeof variableName !== 'undefined'){
    gConsole.document.write('&lt;' + variableName + '&gt; = ');
  }
  gConsole.document.write(value + '<br>');
  // Scroll to the bottom
  gConsole.scroll(0, 16777215);
}
/*----------------------------------------------------------------------------------------
 ☆★ Start a console window ★☆

 Open a console window. This will be opened automatically within p if needed.
----------------------------------------------------------------------------------------*/
function openConsole(){
  var cwOptions = 'width=480, height=160, menubar=no, toolbar=no, scrollbars=yes';
  var cwStyle = '<span style="font-size:8pt;font-family:MS Gothic,monospace">';
  gConsole = window.open('about:blank', 'console', cwOptions);
  gConsole.document.write(cwStyle);
}
/*----------------------------------------------------------------------------------------
 ☆★ Get the defined or default value ( INITialize ARGument ) ★☆

 If <variable> has no defined value, it returns <defaultValue> as the default value.
----------------------------------------------------------------------------------------*/
function InitArg(variable, defaultValue){
  return (typeof variable === 'undefined') ? defaultValue : variable;
}
/*----------------------------------------------------------------------------------------
 ☆★ Show text ★☆

 Displays the text <text> in the text box with the ID specified by <textBoxId>.
----------------------------------------------------------------------------------------*/
function Say(textBoxId, text){
  document.getElementById(textBoxId).value = text;
}
/*----------------------------------------------------------------------------------------
 ☆★ means ★☆
----------------------------------------------------------------------------------------*/
function ShowImage(imageId){
  document.getElementById(imageId).style.display = "inline";
}
/*----------------------------------------------------------------------------------------
 ☆★ Image display ★☆

 The address of the image specified by <imageId> is set to <src>. If the address does not change, nothing will be done.
----------------------------------------------------------------------------------------*/
function SetImage(imageId, src){
  if(document.getElementById(imageId).src != src){
    document.getElementById(imageId).src = src;
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ Get the specified part of elapsed time (Elapsed HOURs/MINutes/SEConds/MilliSEConds) ★☆

 Returns the time elapsed since launch in hours/minutes/seconds/milliseconds. The elapsed time is expressed as the number of frames elapsed.
 This is a calculated value, so there may be some error from the actual time.

 ◎ When 1 hour, 23 minutes, and 45.678 seconds have passed since startup
 p(EHour());  // => 1
 p(EMin()); // => 23
 p(ESec()); // => 45
 p(EMSec());  // => 678
----------------------------------------------------------------------------------------*/
function EHour(){return Math.floor(gFrames / FPS / 3600); }
function EMin() {return Math.floor(gFrames / FPS / 60) % 60; }
function ESec() {return Math.floor(gFrames / FPS) % 60; }
function EMSec(){return Math.floor(gFrames / FPS * 1000) % 1000; }
/*----------------------------------------------------------------------------------------
 ☆★ Get the elapsed time in seconds (Elapsed TIME) ★☆

 Returns the elapsed time in seconds since startup. The fractional part is also returned. Like EHour(), it returns the actual time.
 There may be some discrepancies in the time.
----------------------------------------------------------------------------------------*/
function ETime(){
  return gFrames / FPS;
}
/*----------------------------------------------------------------------------------------
 ☆★ Convert elapsed time into a string (Elapsed Time STRing) ★☆

 Returns the elapsed time since startup in a common time representation. It is similar to EHour() and can be used to express many different times relative to the actual time.
 There may be a small error.

 ◎ 1 hour, 23 minutes, and 45 seconds have passed since startup
 p(EtStr());  // => '01:23:45'
------------------------------------------------------------------------------------------
 <hLength> (default 2) specifies the number of digits for the time. If the number of digits is insufficient, the remaining digits are filled with 0.
 If there are more digits, leave the time part as is.

 ◎ 10 hours have passed since startup
 p(EtStr(4));  // => '0010:00:00'
 p(EtStr(3));  // => '010:00:00'
 p(EtStr(2));  // => '10:00:00'
 p(EtStr(1));  // => '10:00:00'
------------------------------------------------------------------------------------------
 <hDelim>(default ':' ), <mDelim>(default ':' ), <sDelim>(default '' ) are hours, minutes, and seconds, respectively.
 The delimiter ( Hour/Minute/Second DELIMiter ).

 ◎ 1 hour, 23 minutes, and 45 seconds have passed since startup
 p(EtStr(1, '時間', '分', '秒'));  // => '1時間23分45秒'
------------------------------------------------------------------------------------------
 <msLength> (default 0) allows you to specify how many decimal places to include in the seconds string.

 ◎ When 1 hour, 23 minutes, and 45.666 seconds have passed since startup
 p(EtStr(undefined, undefined, undefined, undefined, 0));  // => '01:23:45'
 p(EtStr(undefined, undefined, undefined, '.', 1));        // => '01:23:45.6'
 p(EtStr(undefined, undefined, undefined, '.', 2));        // => '01:23:45.66'
 p(EtStr(undefined, undefined, undefined, '.', 3));        // => '01:23:45.666'
----------------------------------------------------------------------------------------*/
function EtStr(hLength, hDelim, mDelim, sDelim, msLength){
  hLength = InitArg(hLength, 2);
  hDelim = InitArg(hDelim, ':');
  mDelim = InitArg(mDelim, ':');
  sDelim = InitArg(sDelim, '');
  msLength = InitArg(msLength, 0);

  var result = '';
  for(var i = hLength - 1; i >= 1; i--){
    if(EHour() < Math.pow(10, i)) result += '0'
  }
  result += EHour() + hDelim;
  result += ('0' + EMin()).slice(-2) + mDelim;
  result += ('0' + ESec()).slice(-2) + sDelim;
  result += (('00' + EMSec()).slice(-3)).slice(0, msLength);
  return result;
}
/*----------------------------------------------------------------------------------------
 ☆★ Round up/down/up to the specified decimal point ★☆

 Rounds the number <n> up/down.
------------------------------------------------------------------------------------------
 If <place> is 0 (default), the number is processed to be an integer, and if it is a positive number, the number of decimal points is processed to be <place>.
 If a negative number is specified, the integer part of the -<place>th digit is processed.

 p(Round(1234.5678))      // => 1235
 p(Round(1234.5678, 2))   // => 1234.57
 p(Round(1234.5678, -2))  // => 1200
------------------------------------------------------------------------------------------
 Rounding errors are automatically corrected by Justify.
----------------------------------------------------------------------------------------*/
function Round(n, place){
  place = InitArg(place, 0);
  return Justify(Math.round(n * Math.pow(10, place)) / Math.pow(10, place));
}
//----------------------------------------------------------------------------------------
function Floor(n, place){
  place = InitArg(place, 0);
  return Justify(Math.floor(n * Math.pow(10, place)) / Math.pow(10, place));
}
//----------------------------------------------------------------------------------------
function Ceil(n, place){
  place = InitArg(place, 0);
  return Justify(Math.ceil(n * Math.pow(10, place)) / Math.pow(10, place));
}
/*----------------------------------------------------------------------------------------
 ☆★ Rounding error correction ★☆

 Returns <n> corrected for rounding errors. Rounding errors are tiny errors that occur when a computer calculates decimal numbers.
 It means an error.

 p(0.01 + 0.05);           // => 0.060000000000000005
 p(Justify(0.01 + 0.05));  // => 0.06
------------------------------------------------------------------------------------------
 Specifically, the number is rounded off to 15 significant digits. If the number is originally 16 or more significant digits,
 In this case, unintended value changes may occur.
----------------------------------------------------------------------------------------*/
function Justify(n){
  // If it is exactly 0, just return it (because log(0) is not defined)
  if(n == 0) return 0;
  // Convert to a positive number
  var pn = Math.abs(n);
  // Correct to a 15-digit integer
  var cl = Math.floor(Math.log(pn) / Math.LN10);  // Common Logarithm
  pn = Math.round(pn * Math.pow(10, 14 - cl));
  // Stringify
  var result = "" + pn;
  var zeros = "";
  // Add a decimal point in the appropriate place
  if(0 <= cl && cl <= 14){
    result = result.slice(0, cl + 1) + "." + result.slice(cl + 1);
  }else if(cl < 0){
    // Add "0.000..." to the beginning
    for(var i = 0; i < Math.abs(cl) - 1; i++) zeros += "0";
    result = "0." + zeros + result;
  }else{
    // Add "000..." to the end
    for(var i = 15; i < cl; i++) zeros += "0";
    result = result + zeros;
  }
  // Convert it back to a number and return it
  return parseFloat(result) * (n > 0 ? 1 : -1);
}
/*----------------------------------------------------------------------------------------
 ☆★ Random number generation ★☆

 Returns a random integer number between 0 and <n>. If <n> is set to 0 (default), a number between 0 and 1 is returned.
 Returns a random number as a real number.
------------------------------------------------------------------------------------------
 If <times> is an integer greater than or equal to 1, a random array of <times> numbers is created and returned without duplicates.
 If <times> is greater than <n>, a unique random array is generated repeatedly.

 p(Rand(5, 2)) // => 4.2
 p(Rand(5, 5)) // => 2,0,3,1,4
 p(Rand(5, 15)) // => 1,2,0,3,4,2,1,0,4,3,0,1,4,3,2

 The results will change each time it is called.
----------------------------------------------------------------------------------------*/
function Rand(n, times){
  n = InitArg(n, 0);
  times = InitArg(times, 0);

  if(times <= 0){
    // Return by value
    if(n <= 0) return Math.random();
    return Math.floor(Math.random() * n);
  }else{
    // Return it as an array
    var result = [];
    var sequence;
    var choice;
    while(true){
      sequence = [];
      // Create a sequence of numbers
      for(var i = 0; i < n; i++) sequence.push(i);
      // Randomly extract from the sequence
      for(var i = 0; i < n; i++){
        choice = Math.floor(Math.random() * sequence.length);
        result.push(sequence[choice]);
        // End when the required number is reached
        if(result.length == times) return result;
        // Delete the extracted elements
        sequence = sequence.slice(0, choice).concat(sequence.slice(choice + 1));
      }
    }
  }
}
/*----------------------------------------------------------------------------------------
 ☆★ Save to cookie ★☆

 Writes information to a cookie. <name> is the name, <value> is the value, and <expireDays> is the expiration date.
 Specify the number of days until the end of the period (default is 7305 (about 20 years)).
 The format is "name=value; expires=expiration date;".
------------------------------------------------------------------------------------------
 If your browser specifies a cookie expiration date or prohibits the use of cookies, this will take precedence.
----------------------------------------------------------------------------------------*/
function Save(name, value, expireDays){
  expireDays = InitArg(expireDays, 7305);

  // Create a string to save
  var s = encodeURIComponent(name) + "="
  s += encodeURIComponent(value) + "; expires=";
  // Set expiration date
  var xpDate = new Date().getTime();  // eXPire DATE
  xpDate -= 60000 * new Date().getTimezoneOffset();
  xpDate += expireDays * 86400000;
  s += new Date(xpDate).toUTCString();
  // keep
  document.cookie = s;
}
/*----------------------------------------------------------------------------------------
 ☆★ Load from Cookies ★☆

 Reads a cookie and returns the value corresponding to the name <name>, or if the name does not exist.
 <defaultValue> is returned.
----------------------------------------------------------------------------------------*/
function Load(name, defaultValue){
  var cookieStr = document.cookie;  // COOKIE STRing
  var namePos = cookieStr.indexOf(name);  // NAME POSition
  if(namePos == -1) return defaultValue;

  var si = namePos + name.length + 1;   // Start Index
  var ei = cookieStr.indexOf(';', si); // End Index
  ei = (ei == -1) ? cookieStr.length : ei;
  return decodeURIComponent(cookieStr.substring(si, ei));
}
/*----------------------------------------------------------------------------------------
 ☆★ Main Loop ★☆

 After the time equivalent to one frame (1 / <FPS> seconds) has elapsed, the intra-frame processing is performed.
 In principle, all operations other than input (key input, etc.) are processed within this loop.
----------------------------------------------------------------------------------------*/
function MainLoop(){
  // Frame progress check
  // Since setInterval has low accuracy, we manage the time by separately determining whether frames have passed.
  if(new Date() - gStartTime < 1000 / FPS * gFrames) return;
  gFrames++;
  // Manage pressed keys
  for(var i = 0; i < 256; i++) if(gInputs[i] >= 0) gInputs[i]++;
  // In-frame processing, must be defined by the caller
  Main();
}
/*----------------------------------------------------------------------------------------
 ☆★ Processing at the end ★☆

 This is an action that is automatically executed when you move to another page or close the page.
----------------------------------------------------------------------------------------*/
window.onbeforeunload = function(){
  // If the console is open, close it.
  if(typeof gConsole !== 'undefined') if(!gConsole.closed) gConsole.close();
}
/*----------------------------------------------------------------------------------------
 ☆★ Start ★☆

 Called first. Initializes and starts the main loop.
----------------------------------------------------------------------------------------*/
function Execute(){
  // Initialization process in the module
  gStartTime = new Date();
  gFrames = 0;
  gInputs = []; for(var i = 0; i < 256; i++) gInputs.push(-1);
  // Initialization process. Please define it on the caller side.
  Setup();
  // Start the timer
  gTimer = setInterval('MainLoop()', LOOP_INTERVAL)
}
/*----------------------------------------------------------------------------------------
 ☆★ Object: Layer ★☆

 The block specified by the div tag etc. is treated as a layer. When initialized, <id> is the block id
 Please specify (the my_layer part of <div id="my_layer">).
----------------------------------------------------------------------------------------*/
function Layer(id){
  this.layer = document.getElementById(id);
  /*
  Although absolute coordinates are specified here, it is recommended to specify absolute coordinates in advance using a style sheet if possible.
  For example: <div id="my_layer" style="position: absolute;"></div>
  */
  this.layer.style.position = "absolute";
}
/*----------------------------------------------------------------------------------------
 ☆★ means ★☆
----------------------------------------------------------------------------------------*/
Layer.prototype.Show = function(){
  this.layer.style.visibility = "visible";
};
/*----------------------------------------------------------------------------------------
 ☆★ Hide ★☆
----------------------------------------------------------------------------------------*/
Layer.prototype.Hide = function(){
  this.layer.style.visibility = "hidden";
};
/*----------------------------------------------------------------------------------------
 ☆★ Move to specified position ★☆
----------------------------------------------------------------------------------------*/
Layer.prototype.MoveTo = function(x, y){
  this.layer.style.left = x;
  this.layer.style.top = y;
};
/*----------------------------------------------------------------------------------------
 ☆★ Move by specified amount ★☆
----------------------------------------------------------------------------------------*/
Layer.prototype.MoveBy = function(dX, dY){
  this.layer.style.left = parseFloat(this.layer.style.left) + dX;
  this.layer.style.top = parseFloat(this.layer.style.top) + dY;
};
/*----------------------------------------------------------------------------------------
 ☆★ Size change ★☆
----------------------------------------------------------------------------------------*/
Layer.prototype.ResizeTo = function(width, height){
  this.layer.style.width = width;
  this.layer.style.height = height;
};
/*----------------------------------------------------------------------------------------
 ☆★ Change size by specifying relative value ★☆
----------------------------------------------------------------------------------------*/
Layer.prototype.ResizeBy = function(dWidth, dHeight){
  this.layer.style.width = parseFloat(this.layer.style.width) + dWidth;
  this.layer.style.height = parseFloat(this.layer.style.height) + dHeight;
};
/*----------------------------------------------------------------------------------------
 ☆★ Enter text (HTML source) ★☆

 Writes <text> to a layer. <overwrites>=true will overwrite, false will append.
----------------------------------------------------------------------------------------*/
Layer.prototype.Write = function(text, overwrites){
  overwrites = InitArg(overwrites, true);

  if(overwrites) this.layer.innerHTML = text;
  else this.layer.innerHTML += text;
};