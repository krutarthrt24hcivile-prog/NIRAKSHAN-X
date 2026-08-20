import { AlertCircle, LoaderCircle, SearchX } from 'lucide-react'; import { Link } from 'react-router-dom';
export const Loading=({label='Loading verified data…'}:{label?:string})=><div className="state"><LoaderCircle className="spin" size={28}/><span>{label}</span></div>;
export const ErrorState=({message,retry}:{message?:string;retry?:()=>void})=><div className="state error"><AlertCircle size={28}/><span>{message||'We could not load this information.'}</span>{retry&&<button onClick={retry}>Retry</button>}</div>;
export const Empty=({message='No records match this view.'}:{message?:string})=><div className="state"><SearchX size={28}/><span>{message}</span></div>;
export const NotFound=()=> <main className="container py-16"><h1 className="text-3xl font-bold text-navy">Page not found</h1><p className="mt-2">The requested page does not exist.</p><Link className="button primary mt-5" to="/">Return home</Link></main>;
