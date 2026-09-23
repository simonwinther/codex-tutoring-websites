import paperData from '../data/papers.json';
import figureData from '../data/figures.json';
import conceptData from '../data/concepts.json';
import relationshipData from '../data/relationships.json';
import inventory from '../data/inventory.json';
import type {Paper,Figure,Concept,Relationship} from './types';
export const papers = paperData as Paper[];
export const figures = figureData as Figure[];
export const concepts = conceptData as Concept[];
export const relationships = relationshipData as Relationship[];
export {inventory};
export const paperById = (id:string) => papers.find(p=>p.id===id)!;
export const mainFigure = (id:string) => figures.find(f=>f.paper===id&&f.main)!;
export const asset = (file:string) => `${import.meta.env.BASE_URL}${file}`;
export const dimensions = [
 {id:'training',name:'Training efficiency',description:'What is learned, frozen, or avoided?'},
 {id:'inference',name:'Sampling / inference efficiency',description:'Less waiting, fewer steps, or a different trade-off?'},
 {id:'backbone',name:'Backbone / architecture efficiency',description:'Account for parameters and all parts of the pipeline.'},
 {id:'representation',name:'Representation efficiency',description:'What survives at a fixed representation size?'},
 {id:'data',name:'Data / annotation efficiency',description:'Separate training-label savings from inference interaction.'},
 {id:'generalization',name:'Generalization / robustness',description:'Which shifts are tested, and where does transfer fail?'},
 {id:'medical',name:'Application / medical AI',description:'Reconstruction, forecasting, and segmentation have different outputs.'}
];
export const focuses=[
 {id:'all',name:'All connections',intro:'A map of shared ideas. Connections show a common concept, not equivalent methods.',ids:papers.map(p=>p.id)},
 {id:'flow',name:'Flow matching',intro:'Learn a new transport, or solve an existing one differently? That is the key distinction.',ids:['pdf','drift','paraflow']},
 {id:'frequency',name:'Wavelets / frequency',intro:'One vocabulary, different jobs: latent learning, augmentation, acquisition priors, bandwidth and texture guidance.',ids:['debat','wcc4ms','sphere','drift','pdf']},
 {id:'segmentation',name:'Medical segmentation',intro:'Compare the structural prior, training labels, and deployment assumptions—not scores from different tasks.',ids:['sphere','c2p','wcc4ms']},
 {id:'efficiency',name:'Efficiency',intro:'Ask what resource is saved. Latency, computation, model size, latent capacity and labels are not interchangeable.',ids:['paraflow','drift','debat','wcc4ms','sphere','transferability']},
 {id:'generalization',name:'Generalization',intro:'Robustness has a test protocol. Compare the actual shift and the evidence, including failure cases.',ids:['sphere','c2p','wcc4ms','drift','transferability']}
];
