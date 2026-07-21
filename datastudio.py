import pyautogui
import time
import pyperclip
import webbrowser

def main():
    print("============================================================")
    print("DATA STUDIO AUTOMATION")
    print("============================================================")
    import sys
    
    print("\nINSTRUCTIONS:")
    print("1. Your email should already be copied to your clipboard.")
    print("2. Press ENTER to open Data Studio and start the macro.")
    print("3. DO NOT TOUCH YOUR MOUSE OR KEYBOARD until it is finished!")
    
    if "--auto" not in sys.argv:
        input("\nPress ENTER to start...")
    else:
        print("\n[AUTO-MODE] Starting automatically in 2 seconds...")
        time.sleep(2)
    
    url = "https://datastudio.google.com/u/0/reporting/83ab6a98-d02b-4d39-b793-c17189710132/page/ewQiF"
    webbrowser.open_new_tab(url)
    
    print("\nWaiting 15 seconds for Data Studio to fully load...")
    time.sleep(15)
    
    print("Executing Phase 1: Switching to Bison BO and focusing Email...")
    email_to_paste = pyperclip.paste().strip()
    
    # Macro 1: Switch to Bison BO and focus the precise <input> box
    js_macro_1 = "(function(){try{function simClick(el){el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}let els=Array.from(document.querySelectorAll('*'));let bison=els.find(e=>e.children.length===0&&e.textContent.trim()==='Bison BO'&&e.getBoundingClientRect().width>0);if(bison){simClick(bison);setTimeout(()=>{let els2=Array.from(document.querySelectorAll('*'));let emailLabel=els2.find(e=>e.children.length===0&&e.textContent.trim()==='Email (lowercase)'&&e.getBoundingClientRect().width>0);if(emailLabel){let r=emailLabel.getBoundingClientRect();let inputs=Array.from(document.querySelectorAll('input'));let target=null;let minDist=Infinity;for(let inp of inputs){let ir=inp.getBoundingClientRect();if(ir.width>0&&ir.top>=r.bottom){let dx=(ir.left+ir.width/2)-(r.left+r.width/2);let dy=ir.top-r.bottom;let d=dx*dx+dy*dy;if(d<minDist){minDist=d;target=inp;}}}if(target){target.focus();if(target.style)target.style.border='3px solid blue';simClick(target);}else{alert('Could not find the email input box!');}}},1500);}}catch(e){alert('Macro 1 Error: '+e.message);}})();"
    
    pyperclip.copy(js_macro_1)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    time.sleep(3) # Wait for javascript macro to finish clicking and focusing
    
    print("Typing the email using simulated keystrokes...")
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.1)
    pyautogui.press('backspace')
    time.sleep(0.1)
    # RESTORE THE EMAIL TO THE CLIPBOARD!
    pyperclip.copy(email_to_paste)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    time.sleep(1)
    
    print("Executing Phase 2: Opening the Date Picker...")
    # Macro 2: Open Date Picker (using simple point click)
    js_macro_2 = "(function(){try{function simClick(el){el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}let els=Array.from(document.querySelectorAll('*'));let dateLabel=els.find(e=>e.children.length===0&&e.textContent.trim()==='UTC Time'&&e.getBoundingClientRect().width>0);if(dateLabel){let r=dateLabel.getBoundingClientRect();let target=document.elementFromPoint(r.left+10,r.bottom+15);if(target)simClick(target);}}catch(e){alert('Macro 2 Error: '+e.message);}})();"

    pyperclip.copy(js_macro_2)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("Waiting for Date Picker to open...")
    time.sleep(2)
    
    print("Executing Phase 3: Setting the Date Range (2 months ago -> today)...")
    # Macro 3: Navigate calendar back 1 month (to get 2 months ago), select days, click Apply
    js_macro_3 = "(function(){try{function simClick(el){el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(el.style)el.style.border='2px solid blue';}let arrows=Array.from(document.querySelectorAll('*')).filter(e=>{let t=e.textContent.trim().toLowerCase();let a=e.getAttribute('aria-label');return(t==='chevron_left'||t==='keyboard_arrow_left'||t==='<'||a==='Previous month')&&e.getBoundingClientRect().width>0;});arrows.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);if(arrows.length>=1){let leftPrev=arrows[0];simClick(leftPrev);setTimeout(()=>{let day=new Date().getDate().toString();let days=Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0&&e.textContent.trim()===day);days=days.filter(e=>{let r=e.getBoundingClientRect();return r.width>15&&r.width<60&&r.height>15&&r.height<60;});days.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);if(days.length>=2){simClick(days[0]);setTimeout(()=>{simClick(days[days.length-1]);setTimeout(()=>{let applyBtn=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&e.textContent.trim().toLowerCase()==='apply'&&e.getBoundingClientRect().width>0);if(applyBtn)simClick(applyBtn);},500);},500);}else{alert('Could not find the days in the calendar! Expected day: '+day);}},1000);}else{alert('Could not find calendar navigation arrows! Found: '+arrows.length);}}catch(e){alert('Macro 3 Error: '+e.message);}})();"
    
    pyperclip.copy(js_macro_3)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\n✅ Script complete! The report is now fully filtered!")

if __name__ == "__main__":
    main()
