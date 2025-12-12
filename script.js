// Configuration
// 🔴 هام: ضع مفتاح API الخاص بك هنا ليعمل التحليل الحقيقي
// احصل عليه مجاناً من: https://aistudio.google.com/app/apikey
const API_KEY = 'AIzaSyD9sa5G5s_ucVdloUezmNIich7HTtWKVuc';

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeBtn = document.getElementById('removeBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const resultActions = document.getElementById('resultActions');

let currentMode = 'detailed';

// Mode Selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        modeBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Update current mode
        currentMode = btn.dataset.mode;
    });
});

// Event Listeners for Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    uploadArea.classList.add('dragover');
}

function unhighlight(e) {
    uploadArea.classList.remove('dragover');
}

uploadArea.addEventListener('drop', handleDrop, false);
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);
removeBtn.addEventListener('click', removeImage);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

function handleFiles(e) {
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            previewFile(file);
        } else {
            alert('الرجاء رفع ملف صورة صالح');
        }
    }
}

function previewFile(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
        imagePreview.src = reader.result;
        uploadArea.classList.add('hidden');
        previewContainer.classList.remove('hidden');

        // Start analysis
        startAnalysis();
    }
}

function removeImage(e) {
    e.stopPropagation(); // Prevent triggering upload area click if overlapping
    fileInput.value = '';
    imagePreview.src = '';
    previewContainer.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    document.getElementById('resultContainer').classList.add('hidden');
    resultActions.classList.add('hidden'); // Hide actions when image is removed
}

// Copy Functionality
copyBtn.addEventListener('click', async () => {
    const text = document.getElementById('resultContent').innerText;
    try {
        await navigator.clipboard.writeText(text);
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
        copyBtn.style.color = '#4ade80';
        copyBtn.style.borderColor = '#4ade80';

        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
        }, 2000);
    } catch (err) {
        console.error('فشل النسخ:', err);
    }
});

// Text-to-Speech Functionality
let isSpeaking = false;
speakBtn.addEventListener('click', () => {
    const text = document.getElementById('resultContent').innerText;

    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> قراءة';
        speakBtn.classList.remove('speaking');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA'; // تفضيل اللهجة العربية
    utterance.rate = 0.9; // سرعة أبطأ قليلاً للقراءة الواضحة

    // محاولة العثور على صوت عربي جيد
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.includes('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onstart = () => {
        isSpeaking = true;
        speakBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف';
        speakBtn.classList.add('speaking');
    };

    utterance.onend = () => {
        isSpeaking = false;
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> قراءة';
        speakBtn.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
});

async function startAnalysis() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resultContainer = document.getElementById('resultContainer');
    const resultContent = document.getElementById('resultContent');

    // إظهار التحميل والنتيجة معاً لنعرض حالة الاتصال
    loadingOverlay.classList.remove('hidden');
    resultContainer.classList.remove('hidden');
    resultActions.classList.add('hidden'); // Hide actions during analysis
    resultContent.innerHTML = '<p style="color: #fbbf24;">⏳ جاري بدء عملية التحليل...</p>';

    try {
        // التحقق من وجود الصورة
        if (!imagePreview.src || imagePreview.src === '') {
            throw new Error('الرجاء رفع صورة أولاً');
        }

        // تجهيز البيانات
        const base64Image = imagePreview.src.split(',')[1];
        const prompt = getPromptForMode(currentMode);

        // التحقق من مفتاح API
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            await simulateBetterAnalysis();
            return;
        }

        // الاتصال الحقيقي بالذكاء الاصطناعي
        const resultText = await callGeminiAPI(base64Image, prompt, resultContent);

        // عرض النتيجة النهائية
        loadingOverlay.classList.add('hidden');
        resultActions.classList.remove('hidden'); // Show actions after success
        typeWriterEffect(resultText, resultContent);

    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.classList.add('hidden');
        resultContent.innerHTML = `
            <div style="color: #ef4444; padding: 1rem; text-align: center; border: 1px solid #ef4444; border-radius: 8px; background: rgba(239, 68, 68, 0.1);">
                <i class="fas fa-exclamation-circle" style="font-size: 2em; margin-bottom: 10px;"></i>
                <p style="font-weight: bold; margin-bottom: 10px;">فشلت عملية التحليل</p>
                <p style="font-size: 0.9em; direction: ltr; text-align: left; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">${error.message}</p>
                <p style="margin-top: 10px; font-size: 0.8em;">تأكد من اتصال الإنترنت وأن مفتاح API صحيح.</p>
            </div>`;
    }
}

function getPromptForMode(mode) {
    switch (mode) {
        case 'detailed':
            return `قم بتحليل هذه الصورة بدقة متناهية وكأنك خبير فني. أريد تقريراً مفصلاً جداً باللغة العربية يغطي النقاط التالية:
            1. **المشهد العام**: ماذا يحدث في الصورة بالضبط؟
            2. **التفاصيل الدقيقة**: صف الملابس، الملامح، الأشياء الصغيرة، والنصوص إن وجدت.
            3. **الألوان والإضاءة**: صف تناسق الألوان، مصادر الضوء، والظلال.
            4. **الجو والمشاعر**: ما هو الانطباع الذي تتركه الصورة (فرح، حزن، غموض، احترافية)؟
            
            لا تختصر، أريد وصفاً غنياً ودقيقاً جداً.`;
        case 'text':
            return "استخرج جميع النصوص الظاهرة في هذه الصورة واكتبها كما هي تماماً بدقة 100%. رتبها سطر بسطر كما تظهر في الصورة. إذا كانت هناك لغات مختلفة، حددها.";
        case 'social':
            return "أنت خبير سوشيال ميديا محترف. اكتب 'كابشن' (Caption) إبداعي وجذاب لهذه الصورة يصلح للنشر على انستغرام. أضف إيموجي مناسبة، واقترح 5 هاشتاقات قوية ذات صلة بمحتوى الصورة.";
        case 'code':
            return "أنت مبرمج خبير. قم بتحويل تصميم هذه الصورة إلى كود HTML و CSS حقيقي. إذا كانت واجهة موقع، اكتب الهيكل والستايل. أعطني الكود فقط.";
        default:
            return "صف هذه الصورة بدقة باللغة العربية.";
    }
}

async function callGeminiAPI(base64Image, promptText, statusElement) {
    // استخدام الموديل الأحدث والأكثر استقراراً في هذا الإصدار
    const model = 'gemini-2.5-flash'; // <--- تم التعديل إلى gemini-2.5-flash

    try {
        if (statusElement) statusElement.innerHTML += `<p style="color: #94a3b8; font-size: 0.8em;">.. جاري الاتصال بالموديل: ${model}...</p>`;

        // استخدام v1 وهو الإصدار المستقر للـ API
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY.trim()}`; // <--- تم التعديل من v1beta إلى v1

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('استجابة فارغة من الخادم');
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        throw error;
    }
}

// دالة محاكاة محسنة (تعمل فقط إذا لم يضع المستخدم المفتاح)
function simulateBetterAnalysis() {
    return new Promise(resolve => {
        setTimeout(() => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            const resultContainer = document.getElementById('resultContainer');
            const resultContent = document.getElementById('resultContent');

            loadingOverlay.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            resultActions.classList.remove('hidden');

            const mockText = `⚠️ **تنبيه: هذا تحليل تجريبي (محاكاة)**\n\nللحصول على تحليل حقيقي دقيق لصورتك، يجب عليك إضافة مفتاح API في ملف الكود.\n\nلكن لكي ترى كيف سيبدو الشكل النهائي، تخيل أن الذكاء الاصطناعي رأى صورتك وقال:\n"تتميز هذه الصورة بتكوين بصري رائع، حيث تتداخل الألوان الدافئة مع الظلال لتخلق عمقاً فنياً مميزاً. العناصر في المقدمة واضحة وحادة، بينما الخلفية تتمتع بضبابية خفيفة (Bokeh) تعطي تركيزاً على الموضوع الرئيسي. الإضاءة تبدو طبيعية، ربما وقت الغروب أو الشروق، مما يضفي مسحة ذهبية على المشهد..."`;

            typeWriterEffect(mockText, resultContent);
            resolve();
        }, 2000);
    });
}

function typeWriterEffect(text, element) {
    element.innerHTML = '';
    // تحويل فواصل الأسطر إلى HTML
    const formattedText = text.replace(/\n/g, '<br>');

    // تنظيف أي تنسيق Markdown بسيط (اختياري)
    const cleanText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // عرض تدريجي بسيط
    element.innerHTML = cleanText;
    element.style.opacity = 0;

    let opacity = 0;
    const fadeIn = setInterval(() => {
        opacity += 0.05;
        element.style.opacity = opacity;
        if (opacity >= 1) clearInterval(fadeIn);
    }, 30);

}
