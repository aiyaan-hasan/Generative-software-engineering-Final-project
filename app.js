import * as Blockly from 'blockly';

// 1. Custom Block Definitions
Blockly.defineBlocksWithJsonArray([
    {
        "type": "github_workflow",
        "message0": "Workflow %1",
        "args0": [
            { "type": "field_input", "name": "NAME", "text": "CI/CD Pipeline" }
        ],
        "message1": "Triggers: %1",
        "args1": [
            { "type": "input_statement", "name": "TRIGGERS", "check": "workflow_trigger" }
        ],
        "message2": "Jobs: %1",
        "args2": [
            { "type": "input_statement", "name": "JOBS", "check": "workflow_job" }
        ],
        "colour": 230,
        "tooltip": "The root element of a GitHub Actions workflow configuration.",
        "helpUrl": ""
    },
    {
        "type": "workflow_trigger",
        "message0": "Trigger on: %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "EVENT",
                "options": [
                    ["Push Event", "push"],
                    ["Pull Request Event", "pull_request"],
                    ["Manual (workflow_dispatch)", "workflow_dispatch"]
                ]
            }
        ],
        "previousStatement": "workflow_trigger",
        "nextStatement": "workflow_trigger",
        "colour": 120,
        "tooltip": "Specify events that trigger this workflow.",
        "helpUrl": ""
    },
    {
        "type": "workflow_job",
        "message0": "Job ID: %1",
        "args0": [
            { "type": "field_input", "name": "JOB_ID", "text": "build" }
        ],
        "message1": "Runs on: %1",
        "args1": [
            {
                "type": "field_dropdown",
                "name": "RUNNER",
                "options": [
                    ["Ubuntu Latest", "ubuntu-latest"],
                    ["Windows Latest", "windows-latest"],
                    ["macOS Latest", "macos-latest"]
                ]
            }
        ],
        "message2": "Needs (comma-separated Job IDs): %1",
        "args2": [
            { "type": "field_input", "name": "NEEDS", "text": "" }
        ],
        "message3": "If (condition, optional): %1",
        "args3": [
            { "type": "field_input", "name": "IF_COND", "text": "" }
        ],
        "message4": "Env: %1",
        "args4": [
            { "type": "input_statement", "name": "ENV", "check": "env_var" }
        ],
        "message5": "Steps: %1",
        "args5": [
            { "type": "input_statement", "name": "STEPS", "check": "job_step" }
        ],
        "previousStatement": "workflow_job",
        "nextStatement": "workflow_job",
        "colour": 290,
        "tooltip": "Defines a single job: its dependencies, condition, environment, and steps.",
        "helpUrl": ""
    },
    {
        "type": "step_run",
        "message0": "Step: %1",
        "args0": [
            { "type": "field_input", "name": "NAME", "text": "Run a script" }
        ],
        "message1": "If (condition, optional): %1",
        "args1": [
            { "type": "field_input", "name": "IF_COND", "text": "" }
        ],
        "message2": "Command: %1",
        "args2": [
            { "type": "field_input", "name": "COMMAND", "text": "echo 'Hello World'" }
        ],
        "previousStatement": "job_step",
        "nextStatement": "job_step",
        "colour": 20,
        "tooltip": "A step that runs shell commands.",
        "helpUrl": ""
    },
    {

        "type": "step_uses",
        "message0": "Use Action: %1",
        "args0": [
            { "type": "field_input", "name": "ACTION", "text": "actions/checkout@v4" }
        ],
        "message1": "If (condition, optional): %1",
        "args1": [
            { "type": "field_input", "name": "IF_COND", "text": "" }
        ],
        "message2": "With: %1",
        "args2": [
            { "type": "input_statement", "name": "WITH", "check": "action_input" }
        ],
        "previousStatement": "job_step",
        "nextStatement": "job_step",
        "colour": 45,
        "tooltip": "Runs a pre-built GitHub/marketplace Action.",
        "helpUrl": ""
    },
    {

        "type": "key_value_pair",
        "message0": "%1 : %2",
        "args0": [
            { "type": "field_input", "name": "KEY", "text": "key" },
            { "type": "field_input", "name": "VALUE", "text": "value" }
        ],
        "previousStatement": ["action_input", "env_var"],
        "nextStatement": ["action_input", "env_var"],
        "colour": 65,
        "tooltip": "A key:value pair. Plug into an Action's 'With' slot or a Job's 'Env' slot.",
        "helpUrl": ""
    }
]);

// 2. Custom YAML Generator
const yamlGenerator = new Blockly.Generator('YAML');
yamlGenerator.INDENT = '  ';
yamlGenerator.forBlock = {};

// this is the Helper to concatenate connected blocks in statements
yamlGenerator.scrub_ = function (block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    let nextCode = '';
    if (nextBlock && !opt_thisOnly) {
        nextCode = yamlGenerator.blockToCode(nextBlock);
    }
    return code + nextCode;
};

// --- github_workflow (Root) ---
yamlGenerator.forBlock['github_workflow'] = function (block, generator) {
    const name = block.getFieldValue('NAME');
    const triggers = generator.statementToCode(block, 'TRIGGERS');
    const jobs = generator.statementToCode(block, 'JOBS');

    let code = `name: ${name}\n\n`;

    if (triggers.trim()) {
        code += `on:\n${triggers}`;
    } else {
        code += `on:\n  push:\n`;
    }

    if (jobs.trim()) {
        code += `\njobs:\n${jobs}`;
    } else {
        code += `\njobs: {}\n`;
    }
    return code;
};

// --- workflow_trigger ---
yamlGenerator.forBlock['workflow_trigger'] = function (block, generator) {
    const event = block.getFieldValue('EVENT');
    return `  ${event}:\n`;
};

// --- workflow_job (EXTENDED: needs / if / env) ---
yamlGenerator.forBlock['workflow_job'] = function (block, generator) {
    const rawJobId = block.getFieldValue('JOB_ID') || 'job';
    const jobId = rawJobId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const runner = block.getFieldValue('RUNNER');
    const needs = (block.getFieldValue('NEEDS') || '').trim();
    const ifCond = (block.getFieldValue('IF_COND') || '').trim();
    const envCode = generator.statementToCode(block, 'ENV');
    const steps = generator.statementToCode(block, 'STEPS');

    let code = `${jobId}:\n`;
    code += `  runs-on: ${runner}\n`;

    if (needs) {
        const list = needs.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length === 1) {
            code += `  needs: ${list[0]}\n`;
        } else if (list.length > 1) {
            code += `  needs: [${list.join(', ')}]\n`;
        }
    }

    if (ifCond) {
        code += `  if: ${ifCond}\n`;
    }

    if (envCode.trim()) {
        // Add one extra indent level so keys nest under "env:"
        code += `  env:\n${generator.prefixLines(envCode, generator.INDENT)}`;
    }

    if (steps.trim()) {
        code += `  steps:\n${steps}`;
    } else {
        code += `  steps: []\n`;
    }
    return code;
};

yamlGenerator.forBlock['step_run'] = function (block, generator) {
    const name = block.getFieldValue('NAME');
    const command = block.getFieldValue('COMMAND');
    const ifCond = (block.getFieldValue('IF_COND') || '').trim();

    let code = `- name: ${name}\n`;
    if (ifCond) {
        code += `  if: ${ifCond}\n`;
    }
    code += `  run: ${command}\n`;
    return code;
};

yamlGenerator.forBlock['step_uses'] = function (block, generator) {
    const action = block.getFieldValue('ACTION');
    const ifCond = (block.getFieldValue('IF_COND') || '').trim();
    const withCode = generator.statementToCode(block, 'WITH');

    let code = `- uses: ${action}\n`;
    if (ifCond) {
        code += `  if: ${ifCond}\n`;
    }
    if (withCode.trim()) {
        // Add one extra indent level so keys nest under "with:"
        code += `  with:\n${generator.prefixLines(withCode, generator.INDENT)}`;
    }
    return code;
};

// --- key_value_pair (NEW, shared by "with:" and "env:") ---
yamlGenerator.forBlock['key_value_pair'] = function (block, generator) {
    const key = block.getFieldValue('KEY');
    const value = block.getFieldValue('VALUE');
    return `${key}: ${value}\n`;
};

// 3. YAML / Schema Validator
function validateWorkspace(workspace) {
    const errors = [];
    const topBlocks = workspace.getTopBlocks(true);
    const workflowBlock = topBlocks.find(b => b.type === 'github_workflow');

    if (!workflowBlock) {
        return ['No root "Workflow" block found. Drag one in to get started.'];
    }

    if (!(workflowBlock.getFieldValue('NAME') || '').trim()) {
        errors.push('Workflow name cannot be empty.');
    }

    // --- Triggers ---
    let triggerCount = 0;
    let trig = workflowBlock.getInputTargetBlock('TRIGGERS');
    while (trig) {
        triggerCount++;
        trig = trig.getNextBlock();
    }
    if (triggerCount === 0) {
        errors.push('Add at least one Trigger block.');
    }

    // --- Jobs ---
    const jobs = [];
    let jobBlock = workflowBlock.getInputTargetBlock('JOBS');
    while (jobBlock) {
        jobs.push(jobBlock);
        jobBlock = jobBlock.getNextBlock();
    }
    if (jobs.length === 0) {
        errors.push('Add at least one Job block.');
    }

    const seenIds = new Set();
    const needsMap = {};

    jobs.forEach(job => {
        const rawId = (job.getFieldValue('JOB_ID') || '').trim();
        const id = rawId.toLowerCase().replace(/[^a-z0-9-_]/g, '');

        if (!rawId) {
            errors.push('A Job is missing its Job ID.');
        } else if (seenIds.has(id)) {
            errors.push(`Duplicate Job ID: "${id}". Job IDs must be unique.`);
        }
        seenIds.add(id);

        const needsRaw = (job.getFieldValue('NEEDS') || '').trim();
        needsMap[id] = needsRaw ? needsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

        // Steps inside this job
        let stepCount = 0;
        let step = job.getInputTargetBlock('STEPS');
        while (step) {
            stepCount++;
            if (step.type === 'step_run' && !(step.getFieldValue('COMMAND') || '').trim()) {
                errors.push(`Job "${id}": a Step has an empty Command.`);
            }
            if (step.type === 'step_uses' && !(step.getFieldValue('ACTION') || '').trim()) {
                errors.push(`Job "${id}": a "Use Action" step has no action reference.`);
            }
            step = step.getNextBlock();
        }
        if (stepCount === 0) {
            errors.push(`Job "${id}" has no Steps.`);
        }
    });

    // --- "needs" must reference real, other jobs ---
    Object.entries(needsMap).forEach(([id, list]) => {
        list.forEach(n => {
            if (n === id) {
                errors.push(`Job "${id}" cannot list itself in "needs".`);
            } else if (!seenIds.has(n)) {
                errors.push(`Job "${id}" needs unknown job "${n}".`);
            }
        });
    });

    // --- Circular dependency detection (DFS) ---
    const visiting = new Set();
    const visited = new Set();
    function detectCycle(id, path) {
        if (visiting.has(id)) {
            errors.push(`Circular dependency: ${[...path, id].join(' → ')}`);
            return;
        }
        if (visited.has(id)) return;
        visiting.add(id);
        (needsMap[id] || []).forEach(n => {
            if (seenIds.has(n)) detectCycle(n, [...path, id]);
        });
        visiting.delete(id);
        visited.add(id);
    }
    Object.keys(needsMap).forEach(id => detectCycle(id, []));

    return [...new Set(errors)];
}


// 4. Initialize Blockly Workspace
const workspace = Blockly.inject('blocklyDiv', {
    toolbox: {
        "kind": "categoryToolbox",
        "contents": [
            {
                "kind": "category",
                "name": "Workflow",
                "colour": "230",
                "contents": [
                    { "kind": "block", "type": "github_workflow" }
                ]
            },
            {
                "kind": "category",
                "name": "Triggers",
                "colour": "120",
                "contents": [
                    { "kind": "block", "type": "workflow_trigger" }
                ]
            },
            {
                "kind": "category",
                "name": "Jobs",
                "colour": "290",
                "contents": [
                    { "kind": "block", "type": "workflow_job" }
                ]
            },
            {
                "kind": "category",
                "name": "Steps",
                "colour": "20",
                "contents": [
                    { "kind": "block", "type": "step_run" },
                    { "kind": "block", "type": "step_uses" }
                ]
            },
            {
                "kind": "category",
                "name": "Inputs / Env",
                "colour": "65",
                "contents": [
                    { "kind": "block", "type": "key_value_pair" }
                ]
            }
        ]
    },
    grid: {
        spacing: 20,
        length: 3,
        colour: '#cccccc',
        snap: true
    },
    zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 2.0,
        minScale: 0.5,
        scaleSpeed: 1.2
    },
    trashcan: true
});


// 5. Real-time Compilation, Validation & UI Updatinnng

function renderValidation(errors) {
    const validationBadge = document.getElementById('validation-badge');
    const errorList = document.getElementById('validation-errors');

    errorList.innerHTML = '';

    if (errors.length === 0) {
        validationBadge.textContent = '✓ Valid';
        validationBadge.className = 'status-badge badge-success';
        errorList.style.display = 'none';
        return;
    }

    validationBadge.textContent = `⚠ ${errors.length} Issue${errors.length > 1 ? 's' : ''}`;
    validationBadge.className = 'status-badge badge-warning';
    errorList.style.display = 'block';
    errors.forEach(err => {
        const li = document.createElement('li');
        li.textContent = err;
        errorList.appendChild(li);
    });
}

function updateCode() {
    const topBlocks = workspace.getTopBlocks(true);
    let workflowBlock = null;

    for (let block of topBlocks) {
        if (block.type === 'github_workflow') {
            workflowBlock = block;
            break;
        }
    }

    const codeOutput = document.getElementById('code-output');

    if (workflowBlock) {
        try {
            const code = yamlGenerator.blockToCode(workflowBlock);
            codeOutput.textContent = code;
            renderValidation(validateWorkspace(workspace));
        } catch (e) {
            codeOutput.textContent = 'Error generating YAML: ' + e.message;
            const validationBadge = document.getElementById('validation-badge');
            validationBadge.textContent = 'Compiler Error';
            validationBadge.className = 'status-badge badge-warning';
            document.getElementById('validation-errors').style.display = 'none';
        }
    } else {
        codeOutput.textContent = '# Drag in a "Workflow" root block to start generating GitHub Actions configuration...';
        renderValidation(['No root "Workflow" block found.']);
    }
}

workspace.addChangeListener(updateCode);

window.addEventListener('resize', () => Blockly.svgResize(workspace));

//    Demonstrates: env vars, needs, if-conditions, and a "uses" step.
const defaultWorkspaceJson = {
    "blocks": {
        "languageVersion": 0,
        "blocks": [
            {
                "type": "github_workflow",
                "id": "root_workflow",
                "x": 30,
                "y": 30,
                "fields": { "NAME": "CI Build & Deploy" },
                "inputs": {
                    "TRIGGERS": {
                        "block": {
                            "type": "workflow_trigger",
                            "id": "trigger_push",
                            "fields": { "EVENT": "push" }
                        }
                    },
                    "JOBS": {
                        "block": {
                            "type": "workflow_job",
                            "id": "job_build",
                            "fields": {
                                "JOB_ID": "build",
                                "RUNNER": "ubuntu-latest",
                                "NEEDS": "",
                                "IF_COND": ""
                            },
                            "inputs": {
                                "ENV": {
                                    "block": {
                                        "type": "key_value_pair",
                                        "id": "env_node",
                                        "fields": { "KEY": "NODE_ENV", "VALUE": "production" }
                                    }
                                },
                                "STEPS": {
                                    "block": {
                                        "type": "step_run",
                                        "id": "step_install",
                                        "fields": {
                                            "NAME": "Install dependencies",
                                            "IF_COND": "",
                                            "COMMAND": "echo Installing"
                                        },
                                        "next": {
                                            "block": {
                                                "type": "step_run",
                                                "id": "step_test",
                                                "fields": {
                                                    "NAME": "Run tests",
                                                    "IF_COND": "",
                                                    "COMMAND": "echo Testing"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "next": {
                                "block": {
                                    "type": "workflow_job",
                                    "id": "job_deploy",
                                    "fields": {
                                        "JOB_ID": "deploy",
                                        "RUNNER": "ubuntu-latest",
                                        "NEEDS": "build",
                                        "IF_COND": "github.ref == 'refs/heads/main'"
                                    },
                                    "inputs": {
                                        "STEPS": {
                                            "block": {
                                                "type": "step_uses",
                                                "id": "step_checkout",
                                                "fields": {
                                                    "ACTION": "actions/checkout@v4",
                                                    "IF_COND": ""
                                                },
                                                "inputs": {
                                                    "WITH": {
                                                        "block": {
                                                            "type": "key_value_pair",
                                                            "id": "with_fetch_depth",
                                                            "fields": { "KEY": "fetch-depth", "VALUE": "0" }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]
    }
};

Blockly.serialization.workspaces.load(defaultWorkspaceJson, workspace);
Blockly.svgResize(workspace);

// 7. UI Action Listeners
document.getElementById('clear-btn').addEventListener('click', () => {
    workspace.clear();
});

document.getElementById('copy-btn').addEventListener('click', () => {
    const code = document.getElementById('code-output').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const copyBtn = document.getElementById('copy-btn');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy Code';
        }, 2000);
    });
});

// this would be for the Downloading the currently generated YAML as an actual .yml file,
// so the tool produces a real configuration file, not just on-screen text.
document.getElementById('download-btn').addEventListener('click', () => {
    const code = document.getElementById('code-output').textContent;

    // Derive a filename from the workflow's name, falling back to a default.
    const topBlocks = workspace.getTopBlocks(true);
    const workflowBlock = topBlocks.find(b => b.type === 'github_workflow');
    let filename = 'workflow';
    if (workflowBlock) {
        const rawName = (workflowBlock.getFieldValue('NAME') || 'workflow').trim();
        filename = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workflow';
    }

    const blob = new Blob([code], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.textContent = 'Downloaded!';
    setTimeout(() => {
        downloadBtn.textContent = 'Download YAML';
    }, 2000);
});


