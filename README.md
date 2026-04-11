# 🌌 Min-Aton v2 Editorial Futurist DFA Minimization

Min-Aton v2 is a high-fidelity, interactive platform designed to visualize and perform **Deterministic Finite Automaton (DFA) Minimization** using the Myhill-Nerode Theorem. Built with a premium "Editorial Futurist" aesthetic, it combines rigorous computational theory with state-of-the-art web design.

![Min-Aton Branding](https://img.shields.io/badge/Aesthetic-Editorial_Futurist-purple?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Framer_Motion_|_Tailwind-blueviolet?style=for-the-badge)

## 📁 Project Structure

The ecosystem is divided into two primary modules:

### 1. [Concord Landing & Algo Docs](./concord-landing)
The central hub for theoretical documentation and system architecture.
- **Interactive Walkthrough**: A pre-computed example that steps through partitioning, base checks, and propagation.
- **Minimality Verification**: A final phase that re-applies the algorithm to the result to mathematically prove irreducibility.
- **Glassmorphic UI**: High-contrast, interactive background particles and smooth, centered scrolling.

### 2. [DFA Minimizer Tool](./dfa-minimizer)
A functional utility for creating and optimizing custom DFAs.
- **Dynamic Builder**: Add states, define transitions, and mark final/dead states via an intuitive table-filling interface.
- **Automated Minimization**: Runs the partitioning algorithm in real-time with a live "Staircase Grid" visualization.
- **Logic Journal**: A terminal-style log explaining every marking decision throughout the process.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nsutian-saksham/Min-Aton-v2.git
   cd Min-Aton-v2
   ```

2. Install dependencies for both projects:
   ```bash
   # Install Landing Page dependencies
   cd concord-landing
   npm install

   # Install Minimizer dependencies
   cd ../dfa-minimizer
   npm install
   ```

### Running Locally

To run the full suite, open two terminal tabs:

**Tab 1 (Landing Page):**
```bash
cd concord-landing
npm run dev
```

**Tab 2 (Minimizer Tool):**
```bash
cd dfa-minimizer
npm run dev
```

## 🛠️ Technology Stack
- **Framework**: React.js
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS / Vanilla CSS
- **Icons**: Lucide React / React Icons
- **Theory**: Myhill-Nerode Table-Filling Algorithm

## 👤 Author
**HARSH KUMAR | 2024UCS1725**

---
*Built for the Theory of Automata and Formal Languages (TAFL) project.*
