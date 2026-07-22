import time
import subprocess
import sys

# Auto-install required packages
def install_requirements():
    try:
        import pyautogui
        import pyperclip
    except ImportError:
        print("Installing required packages (pyautogui, pyperclip)...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyautogui", "pyperclip"])
        print("Packages installed!\n")

install_requirements()

import pyautogui
import pyperclip

def main():
    print("="*60)
    print("NEW STRATEGY: Automated Multi-Stage Macro")
    print("The python script will now handle the page loading for you!")
    print("="*60)
    print("\nINSTRUCTIONS:")
    print("1. Be on the MAIN DASHBOARD of playbison.")
    print("2. When you press ENTER here, you will have 5 SECONDS to click on your Chrome window to bring it to the front.")
    print("3. DO NOT TOUCH YOUR MOUSE OR KEYBOARD until it is completely finished!")
    print("\nPress ENTER to start...")
    input()
    
    print("\nSwitch to Chrome NOW! (You have 5 seconds...)")
    for i in range(5, 0, -1):
        print(f"{i}...")
        time.sleep(1)
        
    print("Executing Phase 1: Navigating...")
    
    # Macro 1: Click the menus
    js_macro_1 = "(function(){let p=document.evaluate(\"//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'payment&frauds')]]\",document,null,9,null).singleNodeValue;if(p){p.click();setTimeout(()=>{let w=document.evaluate(\"//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'withdraw to confirm')]]\",document,null,9,null).singleNodeValue;if(w)w.click();},1000);}})();"
    pyperclip.copy(js_macro_1)
    
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\nWaiting 7 seconds for the 'Withdrawals To Confirm' page to fully load...")
    # Important: We let the Python script wait instead of Javascript, because page reloading destroys Javascript!
    time.sleep(7)
    
    print("Executing Phase 2: Filtering...")
    
    # Macro 2: Click the dropdowns using simulated mouse events to force complex UI components to react
    js_macro_2 = "(function(){function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}function findText(text,exact=false){let xpath=exact?\"//*[not(self::script) and not(self::style) and normalize-space(text())='\"+text+\"']\":\"//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '\"+text.toLowerCase()+\"')]]\";for(let doc of getFrames()){if(!doc)continue;try{let res=doc.evaluate(xpath,doc,null,7,null);for(let i=0;i<res.snapshotLength;i++){if(res.snapshotItem(i).children.length===0)return res.snapshotItem(i);}if(res.snapshotLength>0)return res.snapshotItem(res.snapshotLength-1);}catch(e){}}return null;}function findInput(sel){for(let doc of getFrames()){if(!doc)continue;try{let el=doc.querySelector(sel);if(el)return el;}catch(e){}}return null;}function simClick(el){if(!el)return;if(el.tagName==='OPTION'){let s=el.closest('select');if(s){s.value=el.value;s.dispatchEvent(new Event('change',{bubbles:true}));return;}}el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}let box=findText('search for a player status')||findInput('input[placeholder*=\"player status\" i]');if(box){simClick(box);}else{let label=findText('player status');if(label){simClick(label);if(label.nextElementSibling)simClick(label.nextElementSibling);let r=label.getBoundingClientRect();let visualBox=label.ownerDocument.elementFromPoint(r.left+10,r.bottom+15);if(visualBox)simClick(visualBox);}else{alert('Could not find Player Status');}}setTimeout(()=>{let v=findText('Verified',true);if(v){simClick(v);}else{alert('Could not find exact Verified text');}setTimeout(()=>{let btn=null;let btnXPath=\"//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'generate')]\";for(let doc of getFrames()){if(!doc)continue;try{btn=doc.evaluate(btnXPath,doc,null,9,null).singleNodeValue;if(btn)break;}catch(e){}}if(btn)simClick(btn);else alert('Could not find Generate button');},500);},1500);})();"
    pyperclip.copy(js_macro_2)
    
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\nWaiting 5 seconds for the table to filter...")
    time.sleep(5)
    
    print("Executing Phase 3: Navigating to the last page...")
    
    # Macro 3: Extract last page number (using robust regex), scroll to view, and click Go
    js_macro_3 = "(function(){function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}let done=false;let foundText=false;let foundBtn=false;let matchStr=\"\";for(let doc of getFrames()){if(!doc||!doc.body)continue;let txt=(doc.body.innerText||\"\")+\" \"+(doc.body.textContent||\"\");let matches=[...txt.matchAll(/\\d+\\s+of\\s+(\\d+)/gi)];if(matches.length===0)continue;foundText=true;let match=matches[matches.length-1];let lastPage=match[1];matchStr=match[0];try{let els=Array.from(doc.querySelectorAll('*'));let goBtn=els.reverse().find(e=>{if(['SCRIPT','STYLE','NOSCRIPT'].includes(e.tagName))return false;let t=e.textContent.trim().toLowerCase();let v=(e.value||'').trim().toLowerCase();return(t==='go'||v==='go')&&e.children.length===0&&e.getBoundingClientRect().width>0;});if(goBtn){foundBtn=true;let inputs=Array.from(doc.querySelectorAll('input')).filter(i=>i.type!=='hidden'&&i.getBoundingClientRect().width>0&&i!==goBtn);let btnR=goBtn.getBoundingClientRect();let closest=null;let minD=Infinity;for(let inp of inputs){let r=inp.getBoundingClientRect();let dx=(r.left+r.width/2)-(btnR.left+btnR.width/2);let dy=(r.top+r.height/2)-(btnR.top+btnR.height/2);let d=Math.sqrt(dx*dx+dy*dy);if(d<minD){minD=d;closest=inp;}}if(closest&&minD<400){goBtn.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(()=>{let nativeSetter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,\"value\").set;if(nativeSetter){nativeSetter.call(closest,lastPage);}else{closest.value=lastPage;}closest.dispatchEvent(new Event('input',{bubbles:true}));closest.dispatchEvent(new Event('change',{bubbles:true}));closest.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));closest.blur();goBtn.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));goBtn.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));goBtn.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(typeof goBtn.click==='function')goBtn.click();},1000);done=true;break;}else{alert('Found Go button, but input box was too far. Min dist: '+Math.round(minD));done=true;}}}catch(e){}}if(!done){if(!foundText)alert('Could not find pagination text (looked for \"X of Y\").');else if(!foundBtn)alert('Found text \"'+matchStr+'\", but could not find the Go button.');else alert('Unknown error in Macro 3');}})();"
    pyperclip.copy(js_macro_3)
    
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\nWaiting 7 seconds for the last page to load...")
    time.sleep(7)
    
    print("Executing Phase 4: Auto-scanning backwards for empty roles...")
    
    # Macro 4: Scan table for empty roles, extract email, and loop via Previous button
    js_macro_4 = "(function(){function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}function findPrevButton(doc){let els=Array.from(doc.querySelectorAll('*'));let prev=els.reverse().find(e=>{if(['SCRIPT','STYLE','NOSCRIPT'].includes(e.tagName))return false;let t=e.textContent.trim().toLowerCase();let v=(e.value||'').trim().toLowerCase();return(t.includes('previous')||v.includes('previous'))&&e.children.length===0&&e.getBoundingClientRect().width>0;});if(!prev){prev=Array.from(doc.querySelectorAll('button, a')).find(e=>e.textContent.toLowerCase().includes('previous')&&e.getBoundingClientRect().width>0);}return prev;}function getCurrentPage(doc){let txt=(doc.body.innerText||\"\")+\" \"+(doc.body.textContent||\"\");let matches=[...txt.matchAll(/(\\d+)\\s+of\\s+(\\d+)/gi)];if(matches.length>0)return matches[matches.length-1][1];return null;}function checkPage(){for(let doc of getFrames()){if(!doc||!doc.body)continue;let ths=Array.from(doc.querySelectorAll('th'));let roleTh=ths.find(th=>th.textContent.trim().toLowerCase()==='roles');let loginTh=ths.find(th=>th.textContent.trim().toLowerCase()==='login');if(roleTh){let roleIdx=ths.indexOf(roleTh);let loginIdx=loginTh?ths.indexOf(loginTh):-1;let trs=Array.from(doc.querySelectorAll('tbody tr'));if(trs.length===0)continue;let foundEmpty=false;let foundEmail=\"\";for(let tr of trs){let td=tr.children[roleIdx];if(td&&td.textContent.trim()===''){foundEmpty=true;td.style.border=\"4px solid red\";tr.style.backgroundColor=\"#ffcccc\";if(loginIdx!==-1){let loginTd=tr.children[loginIdx];if(loginTd)foundEmail=loginTd.textContent.trim();}break;}}if(foundEmpty){if(foundEmail){prompt(\"Empty Role Found! Press Ctrl+C to copy the email:\",foundEmail);}else{alert(\"Found an empty Role, but couldn't find the email in the login column.\");}return;}let prevBtn=findPrevButton(doc);if(prevBtn){if(prevBtn.disabled||prevBtn.classList.contains('disabled')||prevBtn.parentElement.classList.contains('disabled')){alert(\"Scanned all the way to the first page! No empty roles found.\");return;}let oldPageNum=getCurrentPage(doc);prevBtn.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));prevBtn.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));prevBtn.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(typeof prevBtn.click==='function')prevBtn.click();let checks=0;let waitInterval=setInterval(()=>{checks++;let newPageNum=getCurrentPage(doc);if((newPageNum&&newPageNum!==oldPageNum)||checks>15){clearInterval(waitInterval);setTimeout(checkPage,1000);}},500);return;}else{alert(\"Could not find the Previous button to go back.\");return;}}}alert(\"Could not find the 'roles' column in the table.\");}checkPage();})();"
    pyperclip.copy(js_macro_4)
    
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\n✅ Multi-Stage Macro executed successfully! Look at your browser.")

if __name__ == "__main__":
    main()