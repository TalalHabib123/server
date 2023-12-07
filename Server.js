import express from 'express';
import { writeFile } from 'fs/promises';
import cors from 'cors';
import Statement_Cov from './Utils/Coverage_Tools/Statement_Cov.js';
import MCDC_Cov from './Utils/Coverage_Tools/MCDC_Cov.js';
import Decision_Cov from './Utils/Coverage_Tools/Decision_Cov.js';
import Condition_Cov from './Utils/Coverage_Tools/Condition_Cov.js';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/saveCode', async (req, res) => {
    const code = req.body.code;
    if (!code) {
        return res.status(400).send({ Message: 'No code found in request!', Success: false });
    }
    const filePath = './Utils/Test_Codes/Test_Code.js';
    try {
        await writeFile(filePath, code);
        console.log('Code saved successfully!');

        const statementCov = Statement_Cov();
        const mcdc_cov=MCDC_Cov();
        const decision_cov=Decision_Cov();
        const condition_cov=Condition_Cov();
        res.send({ Message: 'Code saved successfully!', Success: true, Statement_Cov: statementCov, MCDC_Cov: mcdc_cov, Decision_Cov: decision_cov, Condition_Cov: condition_cov });
    } catch (err) {
        console.error(err);
        res.status(500).send({ Message: 'Error saving code!', Success: false });
    }
});

app.listen(5000, () => {
    console.log('Server listening on port 5000');
});
