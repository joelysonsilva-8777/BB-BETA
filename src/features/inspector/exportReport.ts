import { Platform, Share } from 'react-native';
import { createReport, type InspectorState } from './engine';

export async function exportReport(state: InspectorState) {
  const report = createReport(state, new Date().toISOString());
  const content = JSON.stringify(report, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `inspetor-simulacao-${state.sequence}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'Relatório JSON gerado para download.';
  }
  const result = await Share.share({ title: report.title, message: content });
  return result.action === Share.dismissedAction ? 'Compartilhamento cancelado.' : 'Relatório enviado ao compartilhamento do aparelho.';
}
