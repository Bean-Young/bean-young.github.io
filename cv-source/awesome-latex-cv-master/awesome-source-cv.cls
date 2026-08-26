\ProvidesClass{awesome-source-cv}[2016/11/05 v1.6.1 Awesome Source CV Class]

\LoadClass[a4paper]{article}

\DeclareOption{green}{
  \def\@green{green}
}

\DeclareOption{red}{
  \def\@red{red}
}

\DeclareOption{indigo}{
  \def\@indigo{indigo}
}
\DeclareOption{orange}{
  \def\@orange{orange}
}

\DeclareOption{localFont}{
  \def\@local{local}
}

\DeclareOption{alternative}{
  \def\@alternative{alternate}
}

\ProcessOptions

% Dependences
%A Few Useful Packages
\RequirePackage[frenchb]{babel}
% XeLaTeX handles UTF-8 input natively; luainputenc is LuaLaTeX-only.
\RequirePackage{fontspec} 					                 % for loading fonts
\RequirePackage{url,parskip} 	    % other packages for formatting
\RequirePackage[usenames,dvipsnames]{xcolor}
\RequirePackage{fullpage}
\RequirePackage[margin=1.5cm]{geometry}
\RequirePackage{fontawesome}
\RequirePackage{hyperref}\hypersetup{hidelinks}
\RequirePackage{titlesec}
\RequirePackage{array}
\RequirePackage{enumitem}
\RequirePackage{longtable} 	
\RequirePackage{etoolbox}
\RequirePackage{tikz}
\RequirePackage[skins]{tcolorbox}


% XeLaTeX handles accented Unicode characters natively.
% Define default accent colors
\definecolor{basecolor}{HTML}{000066}       %BLUE

\ifundef{\@green} {
  \ifundef{\@red} {
    \ifundef{\@indigo}{
      \ifundef{\@orange} {}
      { \definecolor{basecolor}{HTML}{e68a00} }
    }
    { \definecolor{basecolor}{rgb}{0.2, 0.07, 0.48} }
  }
  { \definecolor{basecolor}{HTML}{b30000} }     %RED
}
{ \definecolor{basecolor}{rgb}{0.0, 0.62, 0.38} }

\definecolor{darkGrey}{HTML}{989898}

\colorlet{linkcolor}{basecolor}
\colorlet{accentcolor}{linkcolor!90}
\colorlet{symbolcolor}{linkcolor!85}

% Setup hyperref package, and colours for links
%\definecolor{linkcolour}{rgb}{0,0.2,0.6}
\hypersetup{breaklinks}

\pagestyle{empty}                         % non-numbered pages
%\font\fb=''[cmr10]''                      % for use with \LaTeX command

% Setup CV sections
\titleformat{\section}{\Large\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{2pt}{2pt}

% Configure list
\setlist[itemize,1]{label=\faAngleRight, nosep, leftmargin=2em} 

% Setup Array : new column type
\newcolumntype{R}[1]{>{\hfill}m{#1}}

\hyphenation{im-pre-se}

% Setup fonts
\defaultfontfeatures{Mapping=tex-text}

%\newfontfamily\FA[Path=fonts/]{FontAwesome}

% Define font to use according to localFont option
\ifundef{\@local}
{
  \setmainfont[
    BoldFont = Source Sans Pro Semibold, 
    ItalicFont= Source Sans Pro Light Italic,
    SmallCapsFont = Source Sans Pro]{Source Sans Pro Light}
}
{
  \setmainfont[
    Path = fonts/, 
    BoldFont = SourceSansPro-Semibold, 
    ItalicFont = SourceSansPro-LightIt, 
    SmallCapsFont = SourceSansPro-Regular]{SourceSansPro-Light}
}

%New length definition
\newlength{\rightcolumnlength}
\setlength{\rightcolumnlength}{14.8cm}

\newlength{\leftcolumn}
\setlength{\leftcolumn}{2.5cm}

% Font Awesome icons aliases
\newcommand{\mailSymbol}{\faEnvelope}
\newcommand{\locationSymbol}{\faMapMarker}
\newcommand{\infoSymbol}{\faInfo}
\newcommand{\mobileSymbol}{\faMobilePhone}
\newcommand{\githubSymbol}{\faGithub}
\newcommand{\wechatSymbol}{\faWeixin}

\newcommand\link[2]{\color{linkcolor}\href{#1}{#2}\color{Black} }
\newcommand\important[1]{\textbf #1}

% Create a tag
% Usage: \cvtag{<tag label>}
\newcommand{\cvtag}[1]{%
  %\tikz[baseline]\node[anchor=base,draw=darkGrey!70,rounded corners=0.5ex,inner xsep=1ex,inner ysep =0.55ex,text height=1.3ex,text depth=.25ex]{#1};
\begin{tikzpicture}
	\node[anchor=base,draw=darkGrey!70,rounded corners=0.5ex,inner xsep=1ex,inner ysep =0.55ex,text height=1.3ex,text depth=.25ex]{#1};
\end{tikzpicture}	  
}

\newcommand\user[2]{\color{accentcolor}{\LARGE #1 \textbf{#2}}\color{Black}}

\newcommand{\socialtext}[2]{\mbox{\textcolor{symbolcolor}{#1}\hspace{0.5em}#2\hspace{1em}}}


\newcommand{\sociallink}[3]{\mbox{\textcolor{symbolcolor}{#1}\hspace{0.5em}\link{#2}{#3}\hspace{1em}}}

\newcommand*{\name}[2]{\def\@firstname{#1}\def\@lastname{#2}}
\newcommand*{\firstname}[1]{\def\@firstname{#1}}
\newcommand*{\lastname}[1]{\def\@lastname{#1}}
\newcommand*{\familyname}[1]{\def\@lastname{#1}}
\def\@familyname{\@lastname}



\newcommand*{\address}[1]{\socialtext{\locationSymbol}{#1}}


\newcommand*{\infos}[1]{\socialtext{\infoSymbol}{#1}}

% Only show domain part
\newcommand*{\homepage}[2]{\sociallink{\faGlobe}{#1}{#2}}



\newcommand*{\github}[1]{\sociallink{\githubSymbol}{https://www.github.com/#1}{#1}}
\newcommand*{\wechat}[1]{\sociallink{\wechatSymbol}{https://bean-young.github.io/document/wechat-qr.jpg}{#1}}

\newcommand*{\email}[1]{\sociallink{\mailSymbol}{mailto:#1}{#1}}

\newcommand*\smartphone[1]{\socialtext{\mobileSymbol}{#1}}    

\newcommand\resumetitle[1]{
  \ifundef{\@
  	}{
	 \par{
	 	 \bigskip\center{\Large \color{accentcolor}\textsc{#1}\color{Black}}\par
	 }
	 \bigskip
  }{

	 \par{
	 	\bigskip\center{\Large \color{accentcolor}\textsc{#1}\color{Black}}\par
	 }
	 \bigskip    
  }
}

\newcommand{\socialinfo}[1]{\def\@socialinfo{#1}}
\newcommand*{\makecvheader}{
    \ifundef{\@alternative}{
        \begin{minipage}{\linewidth}
            \color{accentcolor}\user{\@firstname}{\@lastname}\color{black} \vspace*{0.3cm}\\				 	
            \small{\@socialinfo}
        \end{minipage}
    }{
        \begin{minipage}{\linewidth}
            \user{\@firstname}{\@lastname} \vspace*{0.3cm}\\
            \smallskip\\
            \small{\@socialinfo}
        \end{minipage}
        \bigskip
    }
}


\newcommand\sectionTitle[2]{\section{\texorpdfstring{\color{accentcolor}#2\enspace #1}{#1}}}

\newcolumntype{Y}{>{\raggedleft}p{\leftcolumn}}

\newenvironment{scholarship}{%
  \begin{tabular}{Y p{\rightcolumnlength}}
}{%
  \end{tabular}
}

\newcommand\scholarshipentry[2]{
  #1    &  #2 \\
}

\newenvironment{skills}{%
  \begin{longtable}{R{\leftcolumn}p{\rightcolumnlength}}
}{%
  \end{longtable}
}

\newcommand\skill[2]{
  \textsc{#1}    & \foreach \x in {1,...,5}{{\color{accentcolor!80} \ifnumgreater{\x}{#2}{\faCircleO}{\faCircle}}\enspace } 
}

\newcolumntype{E}{>{\raggedright\arraybackslash}p{\rightcolumnlength}}

\newenvironment{experiences}{%
  \begin{longtable}{R{\leftcolumn}|E}
}{%
  \end{longtable}
}
\newcommand\experience[5]{
  \textsc{#1}    & \textsc{#2, #3}   								\\*
  \textsc{#4}    & \begin{minipage}[t]{\rightcolumnlength}
  					         #5
                   \end{minipage}										\\*
}


\newcommand\consultantexperience[9]{
  \textsc{#1}    & \textsc{#2, #3, #4}   								\\*
  \textsc{#5}    & \emph{#6} pour #7                       				\\*
  				       & 	\begin{minipage}[t]{\rightcolumnlength}
  						        #8
                   	\end{minipage}										\\*
                 & \footnotesize{\foreach \n in {#9}{\cvtag{\n}}} 	\\
  }

\newcommand\emptySeparator{\multicolumn{2}{c}{}\\}
