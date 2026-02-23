import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { Download, Upload, BarChart, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AppHeader } from '../components/AppHeader';
import { StatusBar } from '../components/StatusBar';
import { saveDocument, loadDocument } from '../utils/db';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExcelProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Excel({ toggleTheme, isDarkMode }: ExcelProps) {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id') || `excel-${Date.now()}`;

  const [fileName, setFileName] = useState('Untitled Spreadsheet');
  const [data, setData] = useState<any[]>([{ 
    name: 'Sheet1', 
    id: '1', 
    status: 1, 
    celldata: [
      { r: 0, c: 0, v: { v: 'Item A', m: 'Item A' } },
      { r: 0, c: 1, v: { v: '15', m: '15' } },
      { r: 1, c: 0, v: { v: 'Item B', m: 'Item B' } },
      { r: 1, c: 1, v: { v: '25', m: '25' } },
      { r: 2, c: 0, v: { v: 'Item C', m: 'Item C' } },
      { r: 2, c: 1, v: { v: '30', m: '30' } }
    ] 
  }]);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const workbookRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get('id')) {
      loadDocument(docId).then(doc => {
        if (doc && doc.type === 'excel') {
          setFileName(doc.title);
          if (doc.data && doc.data.length > 0) {
             setData(doc.data);
          }
        }
        setIsLoaded(true);
      }).catch(err => {
        console.error("Failed to load spreadsheet", err);
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, [docId, searchParams]);

  useEffect(() => {
    if (isLoaded) {
      setSaveStatus('Saving...');
      const timeout = setTimeout(() => {
        saveDocument(docId, fileName, 'excel', data)
          .then(() => setSaveStatus('Saved'))
          .catch(err => {
            console.error("Failed to save spreadsheet", err);
            setSaveStatus('Error saving');
          });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [data, fileName, docId, isLoaded]);

  const exportXlsx = () => {
    // FortuneSheet data export logic
    const wb = XLSX.utils.book_new();
    const wsData = [];
    
    if (workbookRef.current) {
        const sheetData = workbookRef.current.getAllSheets()[0].data;
        for (let r = 0; r < sheetData.length; r++) {
            const row = [];
            for (let c = 0; c < sheetData[r].length; c++) {
                const cell = sheetData[r][c];
                row.push(cell ? cell.v : '');
            }
            wsData.push(row);
        }
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const celldata: any[] = [];
        json.forEach((row: any, r: number) => {
            row.forEach((val: any, c: number) => {
                if (val !== undefined && val !== null) {
                    celldata.push({ r, c, v: { v: val, m: val.toString() } });
                }
            });
        });
        
        setData([{ name: sheetName, id: '1', status: 1, celldata }]);
    };
    reader.readAsBinaryString(file);
  };

  const generateChart = () => {
    if (!workbookRef.current) return;
    
    // For simplicity, we'll just read the first two columns of the current sheet
    // Col 0: Labels, Col 1: Values
    const sheetData = workbookRef.current.getAllSheets()[0].data;
    const labels = [];
    const values = [];
    
    for (let r = 0; r < 10; r++) { // read up to 10 rows
      if (sheetData[r]) {
        const labelCell = sheetData[r][0];
        const valCell = sheetData[r][1];
        if (labelCell && valCell && valCell.v) {
          labels.push(labelCell.m || labelCell.v);
          values.push(parseFloat(valCell.v) || 0);
        }
      }
    }

    if (labels.length > 0 && values.length > 0) {
      setChartData({
        labels,
        datasets: [
          {
            label: 'Data',
            data: values,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
      setShowChart(true);
    } else {
      alert("Please enter labels in Column A and numbers in Column B to generate a chart.");
    }
  };

  return (
    <div className="app-container">
      <AppHeader 
        appName="NinjaCalc" 
        fileName={fileName} 
        setFileName={setFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        actions={
          <>
            <input 
              type="file" 
              id="upload" 
              accept=".xlsx,.xls,.csv" 
              style={{ display: 'none' }} 
              onChange={onFileUpload} 
            />
            <button className="btn btn-secondary" onClick={() => document.getElementById('upload')?.click()}>
              <Upload size={16} /> Import
            </button>
            <button className="btn btn-secondary" onClick={exportXlsx}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={generateChart}>
              <BarChart size={16} /> Chart
            </button>
          </>
        }
      />

      <div className="spreadsheet-container" style={{ flex: 1, position: 'relative' }}>
        <Workbook 
            ref={workbookRef} 
            data={data} 
            onChange={(d) => setData(d)}
        />
        {showChart && chartData && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', width: '400px', height: '300px', background: 'white', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '1rem', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Generated Chart</h3>
              <button onClick={() => setShowChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Bar options={{ maintainAspectRatio: false, responsive: true }} data={chartData} />
            </div>
          </div>
        )}
      </div>

      <StatusBar 
        leftContent={<span>Ready &bull; {saveStatus}</span>}
        rightContent={<span>100%</span>}
      />
    </div>
  );
}