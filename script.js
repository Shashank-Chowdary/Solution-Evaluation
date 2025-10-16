// const GEMINI_API_KEY = 'AIzaSyD7zCT8ZAjh_ZdEkO48nzk-T6NDKLNbWcY';
        // const GEMINI_API_KEY = 'AIzaSyAmT4KDfkmBunEB98q8dv5xS2mf8BJDt9g';

        const GEMINI_API_KEY = 'AIzaSyCVKWx7m-IpEpeViPKgclViRdDxaSrq2LI';
        const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

        // Store factor scores
        let factorScores = {};
        let lastAssessmentMethod = 'manual';
        let presetFactorScores = {};

        // Sample use cases
const sampleUseCases = {
    appointment: {
        name: "Hospital Appointment Booking Agent",
        description: `An autonomous AI agent that handles patient appointment scheduling for a hospital network. The agent can:
- Access real-time availability across multiple departments and facilities
- Understand patient medical history and insurance coverage
- Schedule, reschedule, and cancel appointments
- Send automated reminders via SMS and email
- Handle emergency prioritization and waitlist management
- Coordinate with doctors' schedules and operating room availability
- Process insurance pre-authorization requests

Stakeholders: Patients, doctors, administrative staff, insurance providers
Expected Outcomes: Reduce scheduling time by 70%, improve appointment utilization by 40%, decrease no-shows by 50%`
    },
    fraud: {
        name: "Real-time Fraud Detection System",
        description: `An autonomous AI agent for a financial institution that monitors and responds to suspicious transactions in real-time. The agent can:
- Analyze transaction patterns across millions of accounts simultaneously
- Flag suspicious activities based on behavioral anomalies
- Automatically block high-risk transactions above certain thresholds
- Send alerts to security teams for manual review
- Execute temporary account freezes to prevent fraud
- Generate detailed fraud reports for regulatory compliance
- Learn from feedback to improve detection accuracy

Stakeholders: Account holders, fraud analysts, compliance officers, regulators
Expected Outcomes: Detect fraud within seconds, reduce false positives by 60%, prevent $50M+ in annual fraud losses`
    },
    customer: {
        name: "Customer Support Chatbot",
        description: `An AI-powered customer service agent for an e-commerce platform that handles customer inquiries autonomously. The agent can:
- Answer product questions and provide recommendations
- Process returns, refunds, and exchanges
- Track order status and shipping information
- Resolve billing disputes and payment issues
- Escalate complex cases to human agents
- Access customer purchase history and preferences
- Provide personalized discount codes and promotions
- Handle multi-language conversations

Stakeholders: Customers, support agents, sales team, operations team
Expected Outcomes: Handle 80% of inquiries without human intervention, reduce response time to under 1 minute, improve customer satisfaction by 35%`
    },
    compliance: {
        name: "Regulatory Compliance Auditor",
        description: `An autonomous AI agent that monitors and audits business operations for regulatory compliance. The agent can:
- Review contracts, invoices, and financial documents for compliance violations
- Monitor employee communications for policy breaches
- Track regulatory changes and update internal policies
- Generate compliance reports for auditors and regulators
- Flag potential violations before they occur
- Recommend corrective actions and process improvements
- Maintain audit trails for all compliance activities
- Integrate with legal and HR systems

Stakeholders: Compliance officers, legal team, auditors, regulators, executives
Expected Outcomes: Reduce compliance violations by 85%, cut audit preparation time by 60%, avoid $10M+ in potential fines`
    }
};

function loadSampleUseCase() {
    const selected = document.getElementById('sampleUseCase').value;
    if (!selected) return;
    
    const useCase = sampleUseCases[selected];
    
    // Populate use case name
    document.getElementById('usecaseName').value = useCase.name;
    
    // Populate description
    document.getElementById('description').value = useCase.description;
    
    // Clear file upload if active
    clearFile();
    
    // Switch to text input mode
    switchInputMethod('text');
    
    // Update validation
    updateAwaitingInput();
    
    // Visual feedback
    // showNotification(`✓ Loaded sample use case: ${useCase.name}`, 'success');
}

        // Input method switching
function switchInputMethod(method) {
    const textTab = document.getElementById('textInputTab');
    const fileTab = document.getElementById('fileUploadTab');
    const textSection = document.getElementById('textInputSection');
    const fileSection = document.getElementById('fileUploadSection');
    
    if (method === 'text') {
        textTab.classList.add('active');
        fileTab.classList.remove('active');
        textSection.style.display = 'block';
        fileSection.style.display = 'none';
        
        // Clear file if switching back to text
        // clearFile();
    } else {
        textTab.classList.remove('active');
        fileTab.classList.add('active');
        textSection.style.display = 'none';
        fileSection.style.display = 'block';
    }
}

// File upload handler
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Add file type validation
    const allowedTypes = ['text/plain', 'application/pdf', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) 
    {
        alert('Invalid file type. Please upload TXT, PDF, or DOCX files.');
        clearFile();
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    const fileType = file.name.split('.').pop().toLowerCase();
    
    try {
        let text = '';
        
        if (fileType === 'txt') {
            text = await readTextFile(file);
        } else if (fileType === 'pdf') {
            text = await readPDFFile(file);
        } else if (fileType === 'docx' || fileType === 'doc') {
            text = await readDocxFile(file);
        } else {
            alert('Unsupported file type. Please upload TXT, PDF, or DOCX files.');
            return;
        }
        
        // Set the description
        document.getElementById('description').value = text;
        
        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').style.display = 'block';
        
        // Update validation
        updateAwaitingInput();
        
    } catch (error) {
        console.error('File reading error:', error);
        alert('Failed to read file. Please try again or use a different file.');
    }
}

// Read text file
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Read PDF file
async function readPDFFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        // Show progress for large PDFs
        const totalPages = pdf.numPages;
        for (let i = 1; i <= totalPages; i++) {
            // Update UI with progress
            updateFileProgress(i, totalPages);
            
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    } catch (error) {
        throw new Error('Failed to read PDF file');
    }
}

// Read DOCX file
async function readDocxFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        throw new Error('Failed to read DOCX file');
    }
}

// Clear file
function clearFile() {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('fileName').textContent = '';
}

// Drag and drop handlers
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files;
        handleFileUpload({ target: { files: [files[0]] } });
    }
});

        // Factor context for AI understanding
        const factorContext = {
            'cost': {
                description: 'Operational costs (LLM API calls), system resource costs (IT infrastructure), and human resource costs',
                risk: 'Agentic AI can create runaway operational costs if decision-making is continuous, high-frequency, or data-intensive',
                alternative: 'Use a rules-based automation system for routine tasks and only involve a human in complex negotiations',
                mitigation: 'Implement cost-governance controls — limit API calls, use budget caps, and introduce checkpoints'
            },
            'time-efficiency': {
                description: 'Cycle time reduction, throughput increase, and latency reduction for customer-facing tasks',
                risk: 'Over-reliance on an autonomous agent for speed can backfire, causing significant delays if the agent cannot handle edge cases',
                alternative: 'Use AI as a decision-support tool that suggests optimal solutions to a human who makes the final call',
                mitigation: 'Design the agent with clear timeout protocols and automatic escalation to a human operator'
            },
            'accuracy-quality': {
                description: 'Error rate reduction, compliance & audit success, and consistency in standardized task execution',
                risk: 'Errors in autonomous decision-making can lead to significant financial loss, compliance violations, and reduction in service quality',
                alternative: 'Use specialized AI for data extraction, but have a human verify accuracy before approval',
                mitigation: 'Implement a tiered-review system where agent handles low-value tasks but flags complex cases for human review'
            },
            'productivity-scalability': {
                description: 'Employee productivity improvements, scalability for larger volumes, and automation coverage percentage',
                risk: 'Focusing solely on scaling tasks can lead to a drop in quality, harming business metrics and requiring human effort to fix damage',
                alternative: 'Use template-based automation for large-scale tasks and reserve AI for analyzing responses',
                mitigation: 'Use the agent to draft and prepare tasks, but require human approval before execution'
            },
            'strategic-opportunity': {
                description: 'Innovation enablement for new business models, competitive advantage, and risk mitigation',
                risk: 'Entrusting high-stakes strategic decisions to an autonomous agent can lead to costly errors based on flawed data',
                alternative: 'Use AI for data gathering and analysis, but have human experts conduct final strategic review',
                mitigation: 'Require the AI to cite sources and provide confidence scores, with mandatory human approval for high-risk actions'
            },
            'transparency': {
                description: 'Need for explainable AI decisions in regulated or customer-facing contexts',
                risk: 'LLM-based decisions can be hard to explain, making it impossible to justify actions to regulators or customers',
                alternative: 'Use structured scoring systems with transparent criteria',
                mitigation: 'Add decision logging and explanation layers — store reasoning steps and generate human-readable justifications'
            },
            'human-impact': {
                description: 'Impact on human roles and customer relationships, empathy requirements',
                risk: 'AI cannot replicate empathy, and removing humans risks harming customer trust and brand reputation',
                alternative: 'Use AI only as a support tool while a human leads the conversation and manages the relationship',
                mitigation: 'Set boundaries where AI escalates to a human for emotionally charged or sensitive topics'
            },
            'integration-complexity': {
                description: 'System integration challenges with legacy and modern systems',
                risk: 'Integration complexity can cause delays, data mismatches, and extra maintenance costs',
                alternative: 'Start with point-specific automation before attempting multi-system autonomy',
                mitigation: 'Adopt modular integration through APIs or middleware that can be swapped without touching all legacy systems'
            },
            'real-time-data': {
                description: 'Real-time processing requirements and latency sensitivity',
                risk: 'LLM decision latency may be unsuitable for millisecond-level or safety-critical operations',
                alternative: 'Use real-time control systems optimized for low latency and deterministic performance',
                mitigation: 'Restrict the AI to offline analysis and process optimization rather than direct, real-time control'
            },
            'autonomy-goal-orientation': {
                description: 'Level of autonomous decision-making needed, from rule-bound to goal-driven planning',
                risk: 'Poorly defined or overly broad goals can lead an agent to take actions that are technically correct but strategically harmful',
                alternative: 'Use rule-based systems for simple tasks and have humans set strategy for complex goals',
                mitigation: 'Define goals with specific guardrail metrics and implement real-time monitoring'
            },
            'statefulness-memory': {
                description: 'Memory and context requirements for long-term reasoning and continuity',
                risk: 'Lack of effective long-term memory can make agents incapable of handling processes requiring previous context',
                alternative: 'Use structured systems where context is explicitly logged by a human at each step',
                mitigation: 'Integrate the agent with a dedicated memory system like a vector database to store and retrieve context'
            },
            'human-in-loop': {
                description: 'Human oversight requirements, from full oversight to minimal checkpoints',
                risk: 'Insufficient human oversight can lead to autonomous actions that violate policies or cause damage',
                alternative: 'Maintain human approval workflows for all external or high-impact actions',
                mitigation: 'Implement checkpoints where humans must approve actions exceeding certain risk thresholds'
            },
            'governance-requirements': {
                description: 'Regulatory and policy compliance needs, oversight requirements',
                risk: 'Without governance, AI agents can violate policies, laws, or ethics, damaging brand and legal standing',
                alternative: 'Create human-led approval workflows until governance frameworks are in place',
                mitigation: 'Implement agent policy enforcement with rules, monitoring dashboards, and human checkpoints'
            },
            'security-implications': {
                description: 'Data security and access control risks from autonomous AI access',
                risk: 'Autonomous agents can be exploited if attackers trick them into unsafe actions',
                alternative: 'Keep critical security processes manual or semi-automated with multi-factor human verification',
                mitigation: 'Enforce strict role-based access control, sandbox the agent, and add anomaly detection'
            }
        };


       async function callGeminiAPI(prompt, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1536,
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    // Rate limit hit - wait longer before retry
                    if (i < retries) {
                        const waitTime = Math.pow(2, i) * 2000; // 2s, 4s, 8s
                        console.log(`Rate limit hit. Waiting ${waitTime/1000}s before retry ${i+1}/${retries}`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;
            
            // Strip markdown code fences if present
            text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            
            return text;
            
        } catch (error) {
            if (i === retries) {
                console.error('Gemini API Error:', error);
                throw error;
            }
            // Wait before retry for other errors too
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}


        function handleAssessmentMethodChange() {
            const method = document.getElementById('assessmentMethod').value;
            const rolePresetGroup = document.getElementById('rolePresetGroup');
            
            if (method === 'preset') {
                rolePresetGroup.style.display = 'block';
            } else {
                rolePresetGroup.style.display = 'none';
                document.getElementById('rolePreset').value = '';
                document.getElementById('presetLoading').style.display = 'none';
            }
        }

       async function handleRolePresetChange() {
    const rolePreset = document.getElementById('rolePreset').value;
    const useCaseName = document.getElementById('usecaseName').value;
    const description = document.getElementById('description').value;
    
    if (!rolePreset) return;
    
    if (!description.trim()) {
        alert('Please provide a use case description before applying role-specific presets.');
        document.getElementById('rolePreset').value = '';
        return;
    }

    const presetLoading = document.getElementById('presetLoading');
    presetLoading.style.display = 'block';

    try {
        const prompt = createPresetPrompt(rolePreset, useCaseName, description);
        const response = await callGeminiAPI(prompt);
        
        // More robust JSON parsing
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', response);
            console.log('Full AI response:', response);
            throw new Error('AI did not return valid JSON format');
        }
        
        let presetScores;
        try {
            presetScores = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('JSON parsing failed:', parseError);
            console.log('JSON string that failed:', jsonMatch[0]);
            throw new Error('Invalid JSON format from AI');
        }
        
        // More lenient validation - accept partial responses
        const requiredFactors = [
            'cost', 'time-efficiency', 'accuracy-quality', 'productivity-scalability',
            'strategic-opportunity', 'transparency', 'human-impact',
            'integration-complexity', 'real-time-data', 'autonomy-goal-orientation',
            'statefulness-memory', 'human-in-loop',
            'governance-requirements', 'security-implications'
        ];
        
        const returnedFactors = Object.keys(presetScores);
        const missingFactors = requiredFactors.filter(factor => !presetScores.hasOwnProperty(factor));
        
        console.log('AI returned scores for:', returnedFactors);
        console.log('Missing factors:', missingFactors);
        
        // Accept if we got at least 70% of factors
        if (returnedFactors.length < Math.ceil(requiredFactors.length * 0.7)) {
            console.error('Too few factors returned:', returnedFactors.length, 'out of', requiredFactors.length);
            throw new Error(`AI returned too few factors (${returnedFactors.length}/${requiredFactors.length}). Please try again.`);
        }
        
        // Validate that returned scores are valid (1, 3, or 5)
        const invalidScores = Object.entries(presetScores).filter(([factor, score]) => 
            ![1, 3, 5].includes(score)
        );
        
        if (invalidScores.length > 0) {
            console.error('Invalid scores found:', invalidScores);
            throw new Error('AI returned invalid score values. Please try again.');
        }
        
        // Apply the scores we got
        applyPresetScores(presetScores);
        lastAssessmentMethod = 'preset';
        
        // Inform user about missing factors
        if (missingFactors.length > 0) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                font-size: 13px;
                color: #856404;
            `;
            notification.innerHTML = `
                <strong>Partial preset applied:</strong><br>
                AI provided ratings for ${returnedFactors.length} out of ${requiredFactors.length} factors.<br>
                Please manually rate: ${missingFactors.join(', ')}
            `;
            
            const presetSection = document.querySelector('.preset-section');
            presetSection.appendChild(notification);
            
            // Remove notification after 10 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 10000);
        }
        
    } catch (error) {
        console.error('Full preset error details:', error);
        
        if (error.message.includes('400')) {
            alert('API authentication error. Please check your API key configuration.');
        } else if (error.message.includes('429')) {
            alert('API rate limit reached. Please wait a moment and try again, or select factors manually.');
        } else if (error.message.includes('JSON')) {
            alert('AI response format error. Please try again or select factors manually.');
        } else {
            alert(`Failed to apply role-specific preset: ${error.message}\n\nPlease try again or select factors manually.`);
        }
    } finally {
        presetLoading.style.display = 'none';
    }



        }

        function createPresetPrompt(rolePreset, useCaseName, description) {
            const roleContext = {
                'finance': 'Finance teams deal with regulatory compliance, audit requirements, financial data sensitivity, and strict governance. They typically need high transparency, strong governance controls, but may accept higher costs for compliance.',
                'operations': 'Operations teams focus on real-time processes, system reliability, efficiency gains, and minimal downtime. They need fast response times, high automation coverage, but are sensitive to integration complexity.',
                'security': 'Security teams prioritize data protection, access controls, threat mitigation, and risk management. They require strong governance, low security risks, but are cautious about transparency and human oversight.',
                'customer-service': 'Customer service teams value human connection, empathy, customer satisfaction, and brand reputation. They benefit from efficiency gains but are very sensitive to human impact and transparency.'
            };

            const factorContextString = Object.entries(factorContext).map(([factor, context]) => 
                `${factor}: ${context.description} | Risk: ${context.risk}`
            ).join('\n');

            return `
You are an expert AI consultant specializing in role-specific risk assessment for autonomous AI implementation. You understand the detailed context of each factor and their risks.

**Factor Context:**
${factorContextString}

**Role Context:** ${roleContext[rolePreset]}

**Use Case Information:**
- Name: ${useCaseName || 'Custom use case'}
- Description: ${description}
- Selected Role: ${rolePreset}
- Anticipated Autonomy Level: ${autonomyLevel}
- Mission-Critical, Customer-Facing, or Regulatory-Sensitive: ${criticality}

Based on this role's priorities and the specific use case, analyze each factor and provide risk ratings (1=Low, 3=Medium, 5=High) Do not use 2 and 4. Consider:
- The role's typical priorities and constraints
- How the use case aligns with or conflicts with these priorities
- The specific risks each factor poses in this context

Return your response as a JSON object with factor names as keys and risk scores (ONLY 1, 3, or 5) as values:
{
  "cost": 3,
  "time-efficiency": 5,
  "accuracy-quality": 1,
  ...
}

Base your ratings on how each factor's risk level applies to this specific ${rolePreset} use case.
            `.trim();
        }

function applyPresetScores(presetScores) {


    // Clear existing selections
    document.querySelectorAll('.risk-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Apply new scores AND store original preset values
    factorScores = {};
    presetFactorScores = {}; // Store original preset values
    for (const [factor, score] of Object.entries(presetScores)) {
        factorScores[factor] = score;
        presetFactorScores[factor] = score; // Save the preset value
        
        // Find and activate the corresponding button
        const factorGroup = document.querySelector(`[data-factor="${factor}"]`);
        if (factorGroup) {
            const button = factorGroup.querySelector(`.risk-btn.score-${score}`);
            if (button) {
                button.classList.add('active');
            }
        }
    }
    
    updateAwaitingInput();

    // Show visual feedback
    // const appliedCount = Object.keys(presetScores).length;
    showNotification(`✓ AI-suggested risk-factor ratings applied`, 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#34c759' : '#007aff'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function createAssessmentPrompt() {
    const useCaseName = document.getElementById('usecaseName').value || 'Custom use case';
    const description = document.getElementById('description').value;
    const autonomyLevel = document.getElementById('autonomyLevel').value;
    const criticality = document.getElementById('criticality').value;
    const assessmentMethod = document.getElementById('assessmentMethod').value;
    const isCritical = criticality === 'yes';

    // Calculate scores with proper handling of missing values
    const businessFactors = ['cost', 'time-efficiency', 'accuracy-quality', 'productivity-scalability', 'strategic-opportunity', 'transparency', 'human-impact'];
    const technicalFactors = ['integration-complexity', 'real-time-data', 'autonomy-goal-orientation', 'statefulness-memory', 'human-in-loop'];
    const safetyFactors = ['governance-requirements', 'security-implications'];

    const businessSum = businessFactors.reduce((sum, factor) => {
        let score = factorScores[factor];
        if (score === undefined) return sum;
        
        if (factor === 'cost' || factor === 'human-impact') {
            score = 6 - score;
        }
        return sum + score;
    }, 0);

    const technicalSum = technicalFactors.reduce((sum, factor) => {
        const score = factorScores[factor];
        return score !== undefined ? sum + score : sum;
    }, 0);

    const safetySum = safetyFactors.reduce((sum, factor) => {
        const score = factorScores[factor];
        return score !== undefined ? sum + score : sum;
    }, 0);

    const ratedBusinessFactors = businessFactors.filter(factor => factorScores[factor] !== undefined);
    const ratedTechnicalFactors = technicalFactors.filter(factor => factorScores[factor] !== undefined);
    const ratedSafetyFactors = safetyFactors.filter(factor => factorScores[factor] !== undefined);

    const businessScore = ratedBusinessFactors.length > 0 ? 
        Math.round((businessSum / (ratedBusinessFactors.length * 5)) * 100) : 0;
    const technicalScore = ratedTechnicalFactors.length > 0 ? 
        Math.round((technicalSum / (ratedTechnicalFactors.length * 5)) * 100) : 0;
    const safetyScore = ratedSafetyFactors.length > 0 ? 
        Math.round((safetySum / (ratedSafetyFactors.length * 5)) * 100) : 0;
    
    const totalScore = Math.round((businessScore * 0.4) + (technicalScore * 0.4) + (safetyScore * 0.2));

    let decision, title, subtitle;
    if (totalScore >= 75) {
        decision = 'suitable';
        title = 'Suitable for Autonomous AI';
        subtitle = 'Proceed to pilot, fast track if pilot succeeds';
    } else if (totalScore >= 50) {
        decision = 'cautious';
        title = 'Cautious Approach Recommended';
        subtitle = 'Pilot with constraints and safety measures';
    } else {
        decision = 'not_suitable';
        title = 'Not Suitable for Full Autonomy';
        subtitle = 'Postpone or reframe - start with assisted, not autonomous';
    }

    // Different prompts based on assessment method
    if (assessmentMethod === 'manual') {
        // Manual selection - only key recommendations
        return `
You are an expert AI consultant. The user has manually selected risk ratings for their use case.

**Use Case**: ${useCaseName}
**Description**: ${description}
**Autonomy Level**: ${autonomyLevel}
**Critical/Customer-Facing/Regulatory**: ${criticality}

**Calculated Scores**:
- Business Value: ${businessScore}/100
- Technical Fit: ${technicalScore}/100
- Safety & Governance: ${safetyScore}/100
- Total Score: ${totalScore}/100

**Decision**: ${decision.toUpperCase()}

Provide 4-5 actionable key recommendations based on the scores and decision category. Keep recommendations specific and practical.

Return JSON format:
{
  "decision": "${decision}",
  "businessScore": ${businessScore},
  "technicalScore": ${technicalScore},
  "safetyScore": ${safetyScore},
  "totalScore": ${totalScore},
  "title": "${title}",
  "subtitle": "${subtitle}",
  "reasoning": "",
  "keyRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
        `.trim();
    } else {
        // Preset selection - detailed explanation
        
        // Only include factors that HAVEN'T been manually changed
        const unchangedFactors = Object.keys(presetFactorScores).filter(
            factor => factorScores[factor] === presetFactorScores[factor]
        );
        
        // Build the factor ratings string only for unchanged factors
        let factorRatingsText = '';
        
        const unchangedBusiness = businessFactors.filter(f => unchangedFactors.includes(f));
        const unchangedTechnical = technicalFactors.filter(f => unchangedFactors.includes(f));
        const unchangedSafety = safetyFactors.filter(f => unchangedFactors.includes(f));
        
        if (unchangedBusiness.length > 0) {
            factorRatingsText += 'Business Value (AI-suggested, unchanged by user):\n';
            unchangedBusiness.forEach(factor => {
                const score = factorScores[factor];
                const level = score === 1 ? 'Low' : score === 3 ? 'Medium' : 'High';
                const factorName = factor.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                factorRatingsText += `- ${factorName}: ${score} (${level})\n`;
            });
        }
        
        if (unchangedTechnical.length > 0) {
            factorRatingsText += '\nTechnical (AI-suggested, unchanged by user):\n';
            unchangedTechnical.forEach(factor => {
                const score = factorScores[factor];
                const level = score === 1 ? 'Low' : score === 3 ? 'Medium' : 'High';
                const factorName = factor.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                factorRatingsText += `- ${factorName}: ${score} (${level})\n`;
            });
        }
        
        if (unchangedSafety.length > 0) {
            factorRatingsText += '\nSafety (AI-suggested, unchanged by user):\n';
            unchangedSafety.forEach(factor => {
                const score = factorScores[factor];
                const level = score === 1 ? 'Low' : score === 3 ? 'Medium' : 'High';
                const factorName = factor.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                factorRatingsText += `- ${factorName}: ${score} (${level})\n`;
            });
        }
        
        return `


You are an expert AI consultant. You previously provided AI-suggested risk ratings via role-specific preset. Now explain WHY you selected those ratings.

**IMPORTANT**: Only explain the factors that YOU originally suggested and that the USER HAS NOT CHANGED. Do not explain factors the user manually modified.

**Use Case**: ${useCaseName}
**Description**: ${description}
**Autonomy Level**: ${autonomyLevel}
**Critical/Customer-Facing/Regulatory**: ${criticality}

**Your AI-Suggested Factor Ratings (UNCHANGED by user):**
${factorRatingsText}

**Calculated Scores**:
- Business: ${businessScore}/100, Technical: ${technicalScore}/100, Safety: ${safetyScore}/100
- Total Score: ${totalScore}/100

**Your Task**: 
1. Explain in bullet points WHY you (the AI) selected the rating levels shown above (ONLY for unchanged factors)
2. Provide a comprehensive summary explaining the overall decision

**IMPORTANT FORMATTING RULES:**
- Use bullet points (•) for each explanation
- DO NOT use markdown bold (**) or any other markdown formatting
- Write factor names in plain text followed by their score and level
- Keep explanations clear and concise
- Format: "• Factor Name (score, level): explanation text"

**Summary Requirements:**
Write a paragraph (3-5 sentences) that:
- References specific factor scores that influenced your decision (e.g., "The high score of 5 in accuracy-quality indicates...")
- Explains how the use case description content specifically impacts the assessment
- Discusses factor interactions (e.g., how high governance needs combined with low transparency creates risk)
- Connects your reasoning to the autonomy level (${autonomyLevel}) and criticality (${isCritical ? 'Yes' : 'No'})
- Justifies why ${totalScore} falls into the ${decision} category rather than the alternatives

Return JSON format:
{
  "decision": "${decision}",
  "businessScore": ${businessScore},
  "technicalScore": ${technicalScore},
  "safetyScore": ${safetyScore},
  "totalScore": ${totalScore},
  "title": "${title}",
  "subtitle": "${subtitle}",
  "reasoning": "• Bullet point explaining unchanged factor 1\n• Bullet point explaining unchanged factor 2\n• Bullet point explaining unchanged factor 3",
  "summary": "Comprehensive paragraph explaining the overall decision and why this score falls into this category. For example: (1) Reference AT LEAST 3-4 specific factors by name and their scores (e.g., 'The Medium rating (3) for Accuracy & Quality combined with High (5) for Governance Requirements indicates...'). (2) Explain how these SPECIFIC factor combinations create the total score of ${totalScore}. (3) Discuss why certain factors matter MORE for this hospital appointment booking use case. (4) Explain the trade-offs between high-scoring and low-scoring factors. (5) Justify why ${totalScore} is ${decision} and not in adjacent categories. YOUR REASONING MUST CITE ACTUAL FACTOR NAMES AND THEIR NUMERIC SCORES.",
  "keyRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
        `.trim();


            }
}



        function selectRisk(button, factor, score) {

        if (![1, 3, 5].includes(score)) {
                console.error('Invalid score:', score);
                return;
        }
    
            // Remove active class from all buttons in this category
            const categoryButtons = button.parentElement.querySelectorAll('.risk-btn');
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Store the score
            factorScores[factor] = score;
            
            // Update awaiting input status
            updateAwaitingInput();
        }
        // Calculate scores with reverse scoring for cost and human-impact

        function updateAwaitingInput() {
            const requiredFactors = [
                'cost', 'time-efficiency', 'accuracy-quality', 'productivity-scalability',
                'strategic-opportunity', 'transparency', 'human-impact',
                'integration-complexity', 'real-time-data', 'autonomy-goal-orientation',
                'statefulness-memory', 'human-in-loop',
                'governance-requirements', 'security-implications'
            ];

            const description = document.getElementById('description').value.trim();
            const unratedFactors = requiredFactors.filter(factor => !factorScores.hasOwnProperty(factor));
            const awaitingDiv = document.getElementById('awaitingInput');
            
            if (!description) {
                awaitingDiv.innerHTML = `
                    <h4>Missing Information</h4>
                    <p>Description is required. Please fill in all required fields.</p>
                `;
                awaitingDiv.style.background = '#fff0f0';
                awaitingDiv.style.borderColor = '#ff3b30';
                return;
            }

            if (unratedFactors.length === 0) {
                awaitingDiv.innerHTML = `
                    <h4 style="color: #34c759;">Ready for AI Evaluation</h4>
                    <p>All factors rated. Click "Get AI Evaluation" for expert analysis.</p>
                `;
                awaitingDiv.style.background = '#f0fff0';
                awaitingDiv.style.borderColor = '#34c759';
            } else {
                awaitingDiv.innerHTML = `
                    <h4>Awaiting Input</h4>
                    <p>${unratedFactors.length} factor${unratedFactors.length > 1 ? 's' : ''} remaining to rate.</p>
                `;
                awaitingDiv.style.background = '#f0f8ff';
                awaitingDiv.style.borderColor = '#b3d9ff';
            }
        }

        async function submitAssessment() {
            const description = document.getElementById('description').value.trim();
            const descriptionError = document.getElementById('descriptionError');
            
            // Validate description
            if (!description) {
                descriptionError.style.display = 'block';
                document.getElementById('description').focus();
                return;
            } else {
                descriptionError.style.display = 'none';
            }

            // Check if all factors are rated
            const requiredFactors = [
                'cost', 'time-efficiency', 'accuracy-quality', 'productivity-scalability',
                'strategic-opportunity', 'transparency', 'human-impact',
                'integration-complexity', 'real-time-data', 'autonomy-goal-orientation',
                'statefulness-memory', 'human-in-loop',
                'governance-requirements', 'security-implications'
            ];

            const unratedFactors = requiredFactors.filter(factor => !factorScores.hasOwnProperty(factor));
            if (unratedFactors.length > 0) {
                alert(`Please rate all factors before submitting. ${unratedFactors.length} factor${unratedFactors.length > 1 ? 's' : ''} still need${unratedFactors.length === 1 ? 's' : ''} to be rated.`);
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>AI is analyzing...';

            try {
    const assessmentMethod = document.getElementById('assessmentMethod').value;
    const prompt = createAssessmentPrompt();
    const response = await callGeminiAPI(prompt);
    
    console.log('Raw AI response:', response);
    
    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
    }
    
    let jsonString = jsonMatch[0];
    let assessment;
    
    // Try multiple parsing strategies
    const parseStrategies = [
        // Strategy 1: Direct parse
        () => JSON.parse(jsonString),
        
        // Strategy 2: Clean control characters
        () => {
            const cleaned = jsonString.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
            return JSON.parse(cleaned);
        },
        
        // Strategy 3: Fix common issues
        () => {
            let fixed = jsonString
                .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/\\\\n/g, '\\n'); // Fix double escaping
            return JSON.parse(fixed);
        },

        // Strategy 4: Extract and rebuild
() => {
    const decisionMatch = jsonString.match(/"decision":\s*"([^"]+)"/);
    const businessMatch = jsonString.match(/"businessScore":\s*(\d+)/);
    const technicalMatch = jsonString.match(/"technicalScore":\s*(\d+)/);
    const safetyMatch = jsonString.match(/"safetyScore":\s*(\d+)/);
    const totalMatch = jsonString.match(/"totalScore":\s*(\d+)/);
    const titleMatch = jsonString.match(/"title":\s*"([^"]+)"/);
    const subtitleMatch = jsonString.match(/"subtitle":\s*"([^"]+)"/);
    
    // Extract reasoning - try to find it before "summary" or "keyRecommendations"
    let reasoningText = '';
    const reasoning1 = jsonString.match(/"reasoning":\s*"([\s\S]*?)"\s*,\s*"summary"/);
    const reasoning2 = jsonString.match(/"reasoning":\s*"([\s\S]*?)"\s*,\s*"keyRecommendations"/);
    
    if (reasoning1) {
        reasoningText = reasoning1[1];
    } else if (reasoning2) {
        reasoningText = reasoning2[1];
    }
    
    // Extract summary - always try to find it
    let summaryText = '';
    const summary1 = jsonString.match(/"summary":\s*"([\s\S]*?)"\s*,\s*"keyRecommendations"/);
    const summary2 = jsonString.match(/"summary":\s*"([\s\S]*?)"\s*\}/);
    
    if (summary1) {
        summaryText = summary1[1];
    } else if (summary2) {
        summaryText = summary2[1];
    }
    
    const recsMatch = jsonString.match(/"keyRecommendations":\s*\[([\s\S]*?)\]\s*\}/);
    
    if (!decisionMatch || !totalMatch) {
        throw new Error('Could not extract required fields');
    }
    
    let recommendations = [];
    if (recsMatch) {
        const recsString = recsMatch[1];
        recommendations = recsString.match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || [];
    }
    
    return {
        decision: decisionMatch[1],
        businessScore: parseInt(businessMatch?.[1] || '0'),
        technicalScore: parseInt(technicalMatch?.[1] || '0'),
        safetyScore: parseInt(safetyMatch?.[1] || '0'),
        totalScore: parseInt(totalMatch[1]),
        title: titleMatch?.[1] || 'Assessment Complete',
        subtitle: subtitleMatch?.[1] || '',
        reasoning: reasoningText.replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        summary: summaryText.replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        keyRecommendations: recommendations
    };
}
    ];
    
    // Try each strategy until one works
    let lastError;
    for (let i = 0; i < parseStrategies.length; i++) {
        try {
            console.log(`Trying parse strategy ${i + 1}...`);
            assessment = parseStrategies[i]();
            console.log('Parse successful with strategy', i + 1);
            break;
        } catch (e) {
            console.log(`Strategy ${i + 1} failed:`, e.message);
            lastError = e;
            if (i === parseStrategies.length - 1) {
                throw new Error(`All parsing strategies failed. Last error: ${e.message}`);
            }
        }
    }
    
    if (assessment) {
        updateDecisionDisplay(assessment);
    } else {
        throw new Error('Failed to parse assessment');
    }

            // try {
            //     const assessmentMethod = document.getElementById('assessmentMethod').value;
            //     const prompt = createAssessmentPrompt();
            //     const response = await callGeminiAPI(prompt);
                
            //     // Parse the JSON response
            //     const jsonMatch = response.match(/\{[\s\S]*\}/);
            //     if (!jsonMatch) {
            //         throw new Error('Invalid response format from AI');
            //     }
                
            //     const assessment = JSON.parse(jsonMatch[0]);
            //     updateDecisionDisplay(assessment);
                
            } 
            // catch (error) {
            //     console.error('Assessment error:', error);
            //     const outputDiv = document.getElementById('decisionOutput');
            //     outputDiv.innerHTML = `
            //         <div class="decision-placeholder">
            //             <span style="color: #ff3b30;">⚠️ AI Assessment Error</span><br>
            //             Failed to get AI assessment. Please check your connection and try again.
            //         </div>
            //     `;
            catch (error) {
        console.error('Assessment error:', error);
        
        // More specific error messages
        let errorMessage = 'Failed to get AI assessment. ';
        if (error.message.includes('429')) {
            errorMessage += 'Rate limit reached. Please wait a moment.';
        } else if (error.message.includes('API')) {
            errorMessage += 'API connection issue. Please try again.';
        } else {
            errorMessage += 'Please check your connection and try again.';
        }
        
        // Show user-friendly error
        outputDiv.innerHTML = `
            <div class="decision-placeholder">
                <span style="color: #ff3b30;">⚠️ ${errorMessage}</span>
            </div>
        `;
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }

function updateDecisionDisplay(assessment) {
    const outputDiv = document.getElementById('decisionOutput');
    
    // Log to debug
    console.log('Parsed assessment object:', assessment);
    console.log('Summary field:', assessment.summary);
    
    const decisionConfig = {
        suitable: {
            icon: '✅',
            class: 'decision-proceed',
            borderColor: '#34c759'
        },
        cautious: {
            icon: '⚠️',
            class: 'decision-pilot',
            borderColor: '#ffd700'
        },
        not_suitable: {
            icon: '❌',
            class: 'decision-postpone',
            borderColor: '#ff3b30'
        }
    };

    const config = decisionConfig[assessment.decision] || decisionConfig.cautious;

    // Color-code factor ratings function - MUST BE DEFINED FIRST
    function colorCodeFactorRatings(text) {
        if (!text) return text;
        
        // Replace (5, High) or (High) with red color
        text = text.replace(/\(5,?\s*High\)/gi, '<span style="color: #ff3b30; font-weight: 600;">(5, High)</span>');
        text = text.replace(/\(High\)/gi, '<span style="color: #ff3b30; font-weight: 600;">(High)</span>');
        
        // Replace (3, Medium) or (Medium) with orange color
        text = text.replace(/\(3,?\s*Medium\)/gi, '<span style="color: #ff9500; font-weight: 600;">(3, Medium)</span>');
        text = text.replace(/\(Medium\)/gi, '<span style="color: #ff9500; font-weight: 600;">(Medium)</span>');
        
        // Replace (1, Low) or (Low) with green color
        text = text.replace(/\(1,?\s*Low\)/gi, '<span style="color: #34c759; font-weight: 600;">(1, Low)</span>');
        text = text.replace(/\(Low\)/gi, '<span style="color: #34c759; font-weight: 600;">(Low)</span>');
        
        return text;
    }

    // Decision Range Box - appears for both manual and preset
    const decisionRangeHtml = `
        <div class="decision-range-box">
            <div class="range-title">Decision Framework</div>
            <div class="range-content">
                <span class="range-category ${assessment.decision === 'suitable' ? 'range-suitable' : ''}">≥75: Suitable</span>
                <span class="range-category ${assessment.decision === 'cautious' ? 'range-cautious' : ''}">50-74: Cautious</span>
                <span class="range-category ${assessment.decision === 'not_suitable' ? 'range-not-suitable' : ''}">&lt;50: Not Suitable</span>
            </div>
        </div>
    `;

    // Only show reasoning if it exists (preset mode) - WITH COLOR CODING
    const reasoningHtml = assessment.reasoning && assessment.reasoning.trim() ? 
        `<div style="font-size: 13px; line-height: 1.6; text-align: left; margin-top: 15px;">
            <strong>Expert Analysis:</strong><br>
            <div style="white-space: pre-line; margin-top: 8px;">${colorCodeFactorRatings(assessment.reasoning)}</div>
        </div>` : '';

    // Add summary section - ALWAYS SHOW IF IT EXISTS
    const summaryHtml = assessment.summary && assessment.summary.trim() ? 
        `<div style="font-size: 13px; line-height: 1.7; text-align: left; margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #f9f9fb 0%, #ffffff 100%); border-left: 4px solid ${config.borderColor}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <strong style="font-size: 15px; color: #1d1d1f;">Summary</strong>
            </div>
            <div style="color: #424245; font-size: 13px; line-height: 1.7;">${assessment.summary}</div>
        </div>` : '';

    const recommendationsHtml = assessment.keyRecommendations && assessment.keyRecommendations.length > 0 ? 
        `<div style="margin-top: 15px; font-size: 12px; text-align: left;">
            <strong>Key Recommendations:</strong>
            <ul style="margin: 5px 0 0 20px; list-style: disc;">
                ${assessment.keyRecommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
            </ul>
         </div>` : '';

    outputDiv.innerHTML = `
        <div class="decision-result">
            <span class="decision-icon">${config.icon}</span>
            <div class="decision-title">${assessment.title}</div>
            <div class="decision-subtitle">${assessment.subtitle}</div>
            <div class="score-display">
                <div class="score-breakdown">
                    <div class="score-item">
                        <div class="score-label">Business Value</div>
                        <div class="score-value">${assessment.businessScore}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Technical Fit</div>
                        <div class="score-value">${assessment.technicalScore}/100</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Safety & Governance</div>
                        <div class="score-value">${assessment.safetyScore}/100</div>
                    </div>
                </div>
                <div class="total-score">
                    <div class="score-label">Total Score</div>
                    <div class="score-value">${assessment.totalScore}/100</div>
                </div>
            </div>
            ${decisionRangeHtml}
            ${reasoningHtml}
            ${summaryHtml}
            ${recommendationsHtml}
        </div>
    `;
    
    outputDiv.className = `decision-output ${config.class}`;
}

        function resetForm() {
            // Reset form fields
            document.getElementById('usecaseName').value = '';
            document.getElementById('description').value = '';
            document.getElementById('autonomyLevel').value = 'medium';
            document.getElementById('criticality').value = 'yes';
            document.getElementById('assessmentMethod').value = 'manual';
            document.getElementById('rolePreset').value = '';
            
            // Hide role preset group and loading
            document.getElementById('rolePresetGroup').style.display = 'none';
            document.getElementById('presetLoading').style.display = 'none';
            
            // Reset all risk buttons
            document.querySelectorAll('.risk-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Clear factor scores
            factorScores = {};
            lastAssessmentMethod = 'manual';
            
            
            // Hide error messages
            document.getElementById('descriptionError').style.display = 'none';
            
            // Reset decision output
            const outputDiv = document.getElementById('decisionOutput');
            outputDiv.innerHTML = '<div c   lass="decision-placeholder">Complete all factor ratings and click Submit to see the AI evaluation results</div>';
            outputDiv.className = 'decision-output';
            
            // Reset awaiting input
            updateAwaitingInput();
        }

        // Add validation for description field
        document.getElementById('description').addEventListener('blur', function() {
            const descriptionError = document.getElementById('descriptionError');
            if (!this.value.trim()) {
                descriptionError.style.display = 'block';
            } else {
                descriptionError.style.display = 'none';
            }
            updateAwaitingInput();
        });

        document.getElementById('description').addEventListener('input', function() {
            updateAwaitingInput();
        });

        // Initialize form
        document.addEventListener('DOMContentLoaded', function() {
            updateAwaitingInput();
        });
