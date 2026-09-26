import { FlaskConical } from 'lucide-react';

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="demo-banner" role="note">
      <FlaskConical size={17} />
      <span>{children ?? 'Modo demonstração: eventos, preços e fontes são fictícios. Nomes de artistas são usados só como exemplo.'}</span>
    </div>
  );
}
