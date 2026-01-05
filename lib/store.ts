import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AnalysisResult, 
  ViewMode, 
  ProfileMode, 
  ResultsView, 
  ProtocolType,
  ProtocolRecommendation
} from './types';

interface AppState {
  // View states
  viewMode: ViewMode;
  profileMode: ProfileMode;
  resultsView: ResultsView;
  protocolType: ProtocolType;
  showProtocol: boolean;
  
  // Analysis state
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  capturedImage: string | null;
  
  // Feature highlighting
  selectedFeatureId: string | null;
  
  // Protocol recommendations
  protocols: ProtocolRecommendation[];
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setProfileMode: (mode: ProfileMode) => void;
  setResultsView: (view: ResultsView) => void;
  setProtocolType: (type: ProtocolType) => void;
  setShowProtocol: (show: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setCapturedImage: (image: string | null) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setProtocols: (protocols: ProtocolRecommendation[]) => void;
  reset: () => void;
}

const initialState = {
  viewMode: 'camera' as ViewMode,
  profileMode: 'front' as ProfileMode,
  resultsView: 'strengths' as ResultsView,
  protocolType: 'softmax' as ProtocolType,
  showProtocol: false,
  isAnalyzing: false,
  analysisResult: null,
  capturedImage: null,
  selectedFeatureId: null,
  protocols: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setViewMode: (mode) => set({ viewMode: mode }),
      setProfileMode: (mode) => set({ profileMode: mode }),
      setResultsView: (view) => set({ resultsView: view }),
      setProtocolType: (type) => set({ protocolType: type }),
      setShowProtocol: (show) => set({ showProtocol: show }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setAnalysisResult: (result) => set({ analysisResult: result }),
      setCapturedImage: (image) => set({ capturedImage: image }),
      setSelectedFeatureId: (id) => set({ selectedFeatureId: id }),
      setProtocols: (protocols) => set({ protocols: protocols }),
      reset: () => set(initialState),
    }),
    {
      name: 'clavicular-analysis-storage',
      // Only persist the analysis-related state, not UI state
      partialize: (state) => ({
        viewMode: state.viewMode,
        analysisResult: state.analysisResult,
        capturedImage: state.capturedImage,
        protocols: state.protocols,
        resultsView: state.resultsView,
      }),
    }
  )
);

