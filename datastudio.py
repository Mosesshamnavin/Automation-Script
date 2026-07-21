import pyautogui
import time
import pyperclip
import webbrowser

def main():
    print("============================================================")
    print("DATA STUDIO AUTOMATION")
    print("============================================================")
    print("\nINSTRUCTIONS:")
    print("1. Your email should already be copied to your clipboard.")
    print("2. Press ENTER to open Data Studio and start the macro.")
    print("3. DO NOT TOUCH YOUR MOUSE OR KEYBOARD until it is finished!")
    input("\nPress ENTER to start...")
    
    url = "https://datastudio.google.com/u/0/reporting/83ab6a98-d02b-4d39-b793-c17189710132/page/ewQiF"
    webbrowser.open_new_tab(url)
    
    print("\nWaiting 15 seconds for Data Studio to fully load...")
    time.sleep(15)
    
    print("Executing Phase 1: Switching to Bison BO and focusing Email...")
    
    # Macro 1: Switch to Bison BO and focus Email box
    js_macro_1 = "(function(){function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}function simClick(el){el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}for(let doc of getFrames()){if(!doc)continue;let els=Array.from(doc.querySelectorAll('*'));let bison=els.find(e=>e.children.length===0&&e.textContent.trim()==='Bison BO'&&e.getBoundingClientRect().width>0);if(bison){simClick(bison);setTimeout(()=>{let els2=Array.from(doc.querySelectorAll('*'));let emailLabel=els2.find(e=>e.children.length===0&&e.textContent.trim()==='Email (lowercase)'&&e.getBoundingClientRect().width>0);if(emailLabel){let r=emailLabel.getBoundingClientRect();let input=doc.elementFromPoint(r.left+10,r.bottom+15);if(input){simClick(input);}}},1500);break;}}})();"
    
    pyperclip.copy(js_macro_1)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    time.sleep(3) # Wait for javascript macro to finish clicking
    
    print("Pasting the email...")
    # Paste the email
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.2)
    pyautogui.press('backspace')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("Executing Phase 2: Opening the Date Picker...")
    # Macro 2: Open Date Picker
    js_macro_2 = "(function(){function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}function simClick(el){el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}for(let doc of getFrames()){if(!doc)continue;let els=Array.from(doc.querySelectorAll('*'));let dateLabel=els.find(e=>e.children.length===0&&e.textContent.trim()==='UTC Time'&&e.getBoundingClientRect().width>0);if(dateLabel){let r=dateLabel.getBoundingClientRect();let input=doc.elementFromPoint(r.left+10,r.bottom+15);if(input){simClick(input);break;}}}})();"
    
    pyperclip.copy(js_macro_2)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\n✅ Script complete! Let me know if the email was pasted and date picker opened!")

if __name__ == "__main__":
    main()
