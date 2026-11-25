(async () => {
  const id = (key) => document.getElementById(key);
  const status = (message) => { id("notice").textContent = message; };
  const fields = [
    ["firstName","First name"], ["lastName","Last name"], ["birthDate","Birthday"],
    ["handle","Instagram handle"], ["phone","Phone number"],
    ["ages","I'd like to meet someone roughly aged...",["18–25","26–30","31–35","36–40","41+","No preference"]],
    ["diet","Any dietary preferences or allergies?"],
    ["style","My conversation style"],
    ["energy","I identify as...",["Introvert","Extrovert","Somewhere in between"]],
    ["friday","On Friday night I'm more likely to...",["Be out with friends","Have a cozy night in","Go on a spontaneous adventure","Do something planned"]],
    ["date","My ideal first date",["Coffee and a gallery hop","Park picnic","Dive bar and arcade","Farmers market and brunch","Bookstore and dessert","Live music and drinks"]],
    ["fact","One quirky fun fact or guilty pleasure"],
    ["prompt","Which prompt gets you talking?",["Most unexpected adventure","A skill I secretly want to master","Guilty-pleasure TV show","A book or movie that changed my world"]],
    ["source","How did you hear about SSC?",["Instagram","TikTok","A friend","MáLà Project","Another way"]], ["instagram","Do you follow us on Instagram?",["Yes","No"]]
  ];
  const personal = ["firstName","lastName","birthDate","handle","phone"];
  function ageOn(birthday, today = new Date()) {
    const [year, month, day] = birthday.split("-").map(Number);
    const currentMonth = today.getMonth() + 1;
    const beforeBirthday = currentMonth < month || (currentMonth === month && today.getDate() < day);
    return today.getFullYear() - year - Number(beforeBirthday);
  }
  const wrappers = {};
  const styleLabels = ["Mostly listening","More listening than talking","A bit of both","More talking than listening","Mostly talking"];
  function setAnswer(key,value) {
    const group = wrappers[key];
    if (group.tagName === "FIELDSET") {
      for (const radio of group.querySelectorAll("input")) radio.checked = radio.value === value;
      return;
    }
    const input = group.querySelector("input,select,textarea");
    input.value = key === "style" ? (parseInt(value,10) || 3) : value;
    input.dispatchEvent(new Event("input"));
  }
  for (const [key,title,choices] of fields) {
    const heading = {firstName:"The basics",style:"Around the table",source:"About SSC"}[key];
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = heading; id("questions").append(h);
    }
    if (choices) {
      const group = wrappers[key] = document.createElement("fieldset");
      const legend = document.createElement("legend"); legend.textContent = title; group.append(legend);
      const options = document.createElement("div"); options.className = "answer-options";
      for (const value of choices) {
        const option = document.createElement("label"), radio = document.createElement("input");
        Object.assign(radio,{type:"radio",name:key,value}); option.append(radio,value); options.append(option);
      }
      group.append(options); id("questions").append(group); continue;
    }
    const label = wrappers[key] = document.createElement("label");
    label.textContent = title;
    const input = document.createElement(["diet","fact"].includes(key) ? "textarea" : "input");
    input.maxLength = 500;
    if (key === "birthDate") {
      Object.assign(input,{type:"date",autocomplete:"bday"});
      input.oninput = () => {
        const age = ageOn(input.value);
        input.setCustomValidity(input.value && (age < 18 || age > 120) ? "Enter a birthday for someone aged 18 to 120." : "");
      };
    }
    if (key === "firstName" || key === "lastName") Object.assign(input,{
      autocomplete:key === "firstName" ? "given-name" : "family-name",pattern:".*\\S.*"
    });
    if (key === "style") {
      Object.assign(input,{type:"range",min:"1",max:"5",step:"1",value:"3"});
      const ends = document.createElement("span"); ends.className = "range-ends";
      ends.innerHTML = "<span>Listener</span><span>Talker</span>";
      const reading = document.createElement("small");
      input.oninput = () => { reading.textContent = styleLabels[input.value-1]; input.setAttribute("aria-valuetext",reading.textContent); };
      input.setAttribute("aria-label",title); input.oninput();
      label.append(ends,reading);
    }
    if (key === "handle") Object.assign(input,{placeholder:"@yourhandle",pattern:"@?[A-Za-z0-9._]{1,30}",title:"Enter your Instagram username, with or without @."});
    if (key === "phone") {
      Object.assign(input,{type:"tel",autocomplete:"tel",placeholder:"(212) 555-0123"});
      input.addEventListener("input",() => {
        const digits = input.value.replace(/\D/g,"");
        input.setCustomValidity(input.value && (!/^[+\d\s().-]+$/.test(input.value) || digits.length < 7 || digits.length > 15) ? "Enter a phone number, including country code if needed." : "");
      });
    }
    input.name = key;
    input.required = personal.includes(key);
    label.append(input); id("questions").append(label);
  }
  const {url,publishableKey} = window.sscProject;
  try {
    let db, uid, data;
    const demo = location.protocol === "file:" || (!url && !publishableKey);
    if (!demo) {
    const callbackError = [location.search,location.hash].some(part => new URLSearchParams(part.slice(1)).has("error"));
    db = window.supabase.createClient(url,publishableKey);
    id("google").hidden = !window.sscProject.googleEnabled;
    if (window.sscProject.teamEmailOnly) id("authIntro").textContent = "Continue with Google to create or open your profile. Google login is in testing; email links are for SSC team members only.";
    const redirect = location.origin + location.pathname;
    id("google").onclick = async () => {
      const {error} = await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:redirect}});
      if (error) status("Google sign-in could not start. Please try again.");
    };
    id("emailForm").onsubmit = async (e) => {
      e.preventDefault();
      const submit = e.target.querySelector("button"); submit.disabled = true;
      try {
        const {error} = await db.auth.signInWithOtp({email:e.target.elements.email.value.trim(),options:{emailRedirectTo:redirect}});
        if (error) throw error;
        status("Check your inbox and spam folder. Open the newest SSC link to continue.");
      } catch { status("Could not send a link. Check your email address and try again in a minute."); }
      finally { submit.disabled = false; }
    };
    const {data:{session},error} = await db.auth.getSession();
    if (error) throw error;
    if (!session) { id("signin").hidden = false; return status(callbackError ? "Sign-in was canceled or the link expired. Please sign in again." : ""); }
    db.auth.onAuthStateChange((event,next) => {
      if (event === "SIGNED_OUT" || (next && next.user.id !== session.user.id)) location.replace(redirect);
    });
    id("logout").hidden = false;
    id("logout").onclick = async () => {
      const {error} = await db.auth.signOut();
      if (error) status("Sign-out failed. Please try again."); else location.replace(redirect);
    };
    uid = session.user.id;
    const {data:record,error:readError} = await db.from("ssc_profiles").select("answers,photo").eq("user_id",uid).maybeSingle();
    if (readError) throw readError;
    data = record;
    }
    const sample = Object.fromEntries(fields.map(([key]) => [key,""]));
    Object.assign(sample,data?.answers);
    const editor = id("editor"), portrait = id("portrait"), picker = id("photo");
    portrait.src = "assets/brand/ssc-icon-512.png";
    portrait.alt = "Sample profile avatar"; portrait.hidden = false;
    const groups = [
      ["Personal details",personal,"Photo, birthday and contact details"],
      ["At the table",["ages","diet","style","energy"],"Dining and matching preferences"],
      ["Conversation starters",["friday","date","fact","prompt"],"First dates, fun facts and good questions"],
      ["About SSC",["source","instagram"],"How you found the club"]
    ];
    const demoAvatar = portrait.src;
    let savedPhoto = data?.photo || "", editing = 0, creating = !data;
    const useAvatar = document.createElement("button");
    useAvatar.type = "button"; useAvatar.className = "cancel"; useAvatar.textContent = "Use SSC avatar for demo";
    picker.parentElement.after(useAvatar);
    useAvatar.onclick = () => { picker.value = ""; picker.required = false; portrait.src = demoAvatar; portrait.hidden = false; };
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "cancel"; cancel.textContent = "Cancel"; editor.append(cancel);
    const title = document.createElement("h2"); editor.prepend(title);
    function overview(message) {
      editor.hidden = true; id("demoSaved").hidden = false;
      id("memberName").textContent = sample.firstName + " " + sample.lastName;
      id("memberAge").textContent = ageOn(sample.birthDate) + " years old";
      id("savedPhoto").src = savedPhoto;
      id("intro").textContent = sample.fact ? "“" + sample.fact + "”" : "";
      status(message || (demo ? "Preview only · Not shared with SSC" : "Your member profile"));
    }
    groups.forEach(([name,keys,description],index) => {
      const row = document.createElement("button"); row.className = "section-row";
      const text = document.createElement("span"), heading = document.createElement("strong"), detail = document.createElement("small");
      heading.textContent = name; detail.textContent = description; text.append(heading,detail);
      const arrow = document.createElement("span"); arrow.textContent = "↗"; arrow.setAttribute("aria-hidden","true");
      row.append(text,arrow); id("demoSummary").append(row);
      row.onclick = () => {
        editing = index; title.textContent = name; title.tabIndex = -1;
        for (const [key] of fields) {
          setAnswer(key,sample[key]);
          wrappers[key].hidden = !keys.includes(key);
          for (const control of wrappers[key].querySelectorAll("input,select,textarea")) control.disabled = wrappers[key].hidden;
        }
        for (const h of id("questions").querySelectorAll("h2")) h.hidden = true;
        if (savedPhoto) portrait.src = savedPhoto; else portrait.removeAttribute("src");
        picker.value = ""; portrait.hidden = index !== 0 || !savedPhoto; picker.parentElement.hidden = index !== 0;
        picker.required = index === 0 && !savedPhoto; useAvatar.hidden = !demo || index !== 0;
        cancel.textContent = creating ? "Back" : "Cancel";
        id("save").textContent = creating ? (index === groups.length-1 ? "Create profile" : "Continue") : "Save changes";
        status(creating ? "Step " + (index+1) + " of 4" + (demo ? " · Preview" : "") : "Edit your profile");
        id("demoSaved").hidden = true; editor.hidden = false; title.focus();
      };
    });
    id("save").textContent = "Save changes";
    const openStep = index => id("demoSummary").children[index].click();
    function remember() {
      for (const key of groups[editing][1]) sample[key] = editor.elements.namedItem(key).value.trim();
      if (editing === 0 && portrait.hasAttribute("src")) savedPhoto = portrait.src;
    }
    function welcome() {
      editor.hidden = true; id("signin").hidden = false;
      id("authOptions").hidden = true; id("previewOptions").hidden = false;
      id("authIntro").textContent = "Member login is not available yet. Explore the signup flow or see what a returning member's profile looks like.";
      status("Preview only · No account is created. Changes reset on refresh.");
    }
    cancel.onclick = () => {
      if (creating) { remember(); if (editing) openStep(editing-1); else if (demo) welcome(); else location.assign("index.html"); }
      else { overview(); id("demoSummary").children[editing].focus(); }
    };
    const begin = () => { id("signin").hidden = true; openStep(0); };
    if (demo) {
      editor.querySelector("p").textContent = "Try the survey with sample answers. Nothing is uploaded.";
      id("newPreview").onclick = begin;
      id("returnPreview").onclick = () => {
        Object.assign(sample,{firstName:"Alex",lastName:"Rivera",birthDate:"1997-05-12",handle:"@alex.example",phone:"2125550123",fact:"I keep a running ranking of scallion pancakes."});
        savedPhoto = demoAvatar; creating = false; id("signin").hidden = true;
        overview("Sample member · Not logged in. Changes reset on refresh.");
      };
      id("logout").textContent = "Exit preview";
      id("logout").onclick = () => location.reload();
      id("previewOptions").addEventListener("click",() => { id("logout").hidden = false; });
      welcome();
    } else if (creating) begin(); else overview();
    let preview;
    picker.onchange = () => {
      const file = picker.files[0];
      if (!file) return;
      if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 10*1024*1024) {
        picker.value = ""; return status("Choose a JPG, PNG or WebP under 10 MB.");
      }
      if (preview && preview !== savedPhoto) URL.revokeObjectURL(preview);
      preview = URL.createObjectURL(file); portrait.src = preview; portrait.alt = "Your selected photo"; portrait.hidden = false;
    };
    editor.onsubmit = async (event) => {
      event.preventDefault();
      remember();
      if (creating && editing < groups.length-1) { openStep(editing+1); return; }
      if (!demo) {
        id("save").disabled = true; cancel.disabled = true;
        try {
          if (savedPhoto.startsWith("blob:")) {
            const img = new Image(); img.src = savedPhoto; await img.decode();
            const scale = Math.min(1,512/Math.max(img.width,img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1,Math.round(img.width*scale)); canvas.height = Math.max(1,Math.round(img.height*scale));
            canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
            savedPhoto = canvas.toDataURL("image/jpeg",0.8); portrait.src = savedPhoto;
          }
          const {error} = await db.from("ssc_profiles").upsert({user_id:uid,answers:sample,photo:savedPhoto});
          if (error) throw error;
        } catch { status("Your changes were not saved. Check your connection and try again."); return; }
        finally { id("save").disabled = false; cancel.disabled = false; }
      }
      overview(!demo ? "Profile saved." : creating ? "Profile created in this preview · Not shared with SSC" : "Saved for this preview · Not shared with SSC");
      creating = false;
      id("demoSummary").children[editing].focus();
    };
  } catch { status("Your profile could not be loaded. Please refresh and try again."); }
})();
