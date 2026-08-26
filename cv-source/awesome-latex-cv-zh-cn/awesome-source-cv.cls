
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
%\RequirePackage[utf8]{luainputenc}  % luatex
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


% \DeclareUnicodeCharacter{00E9}{\'{e}}  %luatex

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

%Italian hyphenation for the word: ''corporations''
\hyphenation{im-pre-se}

% Setup fonts
\defaultfontfeatures{Mapping=tex-text}
%

%-------------------------------------------------------------------------------
%                Configuration for fonts
%-------------------------------------------------------------------------------
% Font Awesome is configured by the bundled fontawesome package.

% Define font to use according to localFont option
\ifundef{\@local}
{
  %\setmainfont[BoldFont = Helvetica Neue, ItalicFont=Helvetica Neue Thin Italic ,SmallCapsFont = Helvetica Neue Light]{Helvetica Neue Thin}
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
\newcommand{\mailSymbolO}{\faEnvelopeO} 
\newcommand{\locationSymbol}{\faMapMarker}
\newcommand{\infoSymbol}{\faInfo}
\newcommand{\homeSymbol}{\faLink}
\newcommand{\weiboSymbol}{\faWeibo}
\newcommand{\linkedinSymbol}{\faLinkedin}
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
	\node[anchor=base,draw=darkGrey!70,rounded corners=0.5ex,inner xsep=1ex,inner ysep =0.4ex,text height=2ex,text depth=.25ex]{#1};
\end{tikzpicture}	  
}

% Create a chinese tag
% Usage: \cvtag{<tag label>}
\newcommand{\cvtagcn}[1]{%
	%\tikz[baseline]\node[anchor=base,draw=darkGrey!70,rounded corners=0.5ex,inner xsep=1ex,inner ysep =0.55ex,text height=1.3ex,text depth=.25ex]{#1};
	\begin{tikzpicture}
	\node[anchor=base,draw=darkGrey!70,rounded corners=0.5ex,inner xsep=1ex,inner ysep =0.4ex,text height=2ex,text depth=.25ex]{#1};
	\end{tikzpicture}	  
}

% Render author's name
% Usage: \user{<firstanme>}{<lastname>}
\newcommand\user[2]{\color{accentcolor}{\LARGE #1 \textbf{#2}}\color{Black}}

% Render a text with its symbol
% Usage; \socialtext{<icon>}{<label>}
\newcommand{\socialtext}[2]{\mbox{\textcolor{symbolcolor}{#1}\hspace{0.5em}#2\hspace{1em}}}

% Render a link with its symbol
% Usage; \sociallink{<icon>}{<label>}
%\newcommand{\sociallink}[3]{\mbox{\textcolor{symbolcolor}{#1}\hspace{0.5em}#2\hspace{1em}}}
\newcommand{\sociallink}[3]{\mbox{\textcolor{symbolcolor}{#1}\hspace{0.5em}\link{#2}{#3}\hspace{1em}}}


\newcommand*{\name}[2]{\def\@firstname{#1}\def\@lastname{#2}}
\newcommand*{\firstname}[1]{\def\@firstname{#1}}
\newcommand*{\lastname}[1]{\def\@lastname{#1}}
\newcommand*{\familyname}[1]{\def\@lastname{#1}}
\def\@familyname{\@lastname}

% Define author's tagline
% Usage: \tagline{<tag line>}
\newcommand*{\tagline}[1]{\def\@tagline{#1}}

% Render author's address
% Usage: \address{<address>}
\newcommand*{\address}[1]{\socialtext{\locationSymbol}{#1}}

% Render author's infos
% Usage: \infos{<infos>}
\newcommand*{\infos}[1]{\socialtext{\infoSymbol}{#1}}


% Render author's github (optional)
% Usage: \github{<github-nick>}
\newcommand*{\github}[1]{\sociallink{\githubSymbol}{https://www.github.com/#1}{#1}}
\newcommand*{\wechat}[1]{\sociallink{\wechatSymbol}{https://bean-young.github.io/document/wechat-qr.jpg}{#1}}

% Only show domain part
\newcommand*{\homepage}[2]{\sociallink{\faGlobe}{#1}{#2}}

% Render author's email (optional)
% Usage: \email{<email adress>}
\newcommand*{\email}[1]{\sociallink{\mailSymbol}{mailto:#1}{#1}}

% Render author's mobile phone (optional)
% Usage: \smartphone{<mobile phone number>}
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

% Define social entries to print in header
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

% Resume part title definition
\newcommand\sectionTitle[2]{\section{\texorpdfstring{\color{accentcolor}#2\enspace #1}{#1}}}

% Define a new column type for the scholarship environment
\newcolumntype{Y}{>{\raggedleft}p{\leftcolumn}}

% Define the 'scholarship' environment
\newenvironment{scholarship}{%
  \begin{tabular}{Y p{\rightcolumnlength}}
}{%
  \end{tabular}
}

% Render a scholarshipentry in the scolarship environment
% Usage: \scholarshipentry{<date>}{<description>}
\newcommand\scholarshipentry[2]{
  #1    &  #2 \\
}

% Define the 'skills' environment
\newenvironment{skills}{%
  \begin{longtable}{R{\leftcolumn}p{\rightcolumnlength}}
}{%
  \end{longtable}
}

% Render a skill in the skills environment
% Usage: \skill{<skill>}{<level>}
\newcommand\skill[2]{
  \textsc{#1}    & \foreach \x in {1,...,5}{{\color{accentcolor!80} \ifnumgreater{\x}{#2}{\faCircleO}{\faCircle}}\enspace } 
}

\newcolumntype{E}{>{\raggedright\arraybackslash}p{\rightcolumnlength}}

% Define the 'experiences' environment
\newenvironment{experiences}{%
  \begin{longtable}{R{\leftcolumn}|E}
}{%
  \end{longtable}
}


% Render an experience in the experiences environment
% Usage: 
% \tags {<Technology list>}

\newcommand\tags[1]{
	\foreach \n in {#1}{\cvtagcn{\n}} 
}



% Render an experience in the experiences environment
% Usage: 
% \experience
%  {<End date>}      {<Title>}{<Enterprise>}{<Country>}
%  {<Start date}     {
%                      <Experience description (Could be a list)>
%                    }
%                    {<Technology list>}
% \newcommand\experience[5]{
%   \textsc{#1}    & \textsc{#2, #3}   								\\*
%                  & \begin{minipage}[t]{\rightcolumnlength}
%   					         #4
%                    \end{minipage}										\\*
%                  & \footnotesize{\foreach \n in {#5}{\cvtag{\n}}} 	\\
%   }

\newcommand\experience[6]{
  \textsc{#1}    & \textsc{#2, #3}   								\\*
  \textsc{#4}    & \begin{minipage}[t]{\rightcolumnlength}
  					         #5
                   \end{minipage}										\\*
                 & \footnotesize{\foreach \n in {#6}{\cvtag{\n}}} 	\\
  }


% Render a consultant experience in the experiences environment
% Usage: 
% \consultantexperience
%  {<End date>}      {<Consultant title>}{<Consulting Enterprise>}{<Country>}
%  {<Start date}     {<Client title>}{<Client business unit>}
%                    {
%                      <Experience description (Could be a list)>
%                    }
%                    {<Technology list>}
\newcommand\consultantexperience[9]{
  \textsc{#1}    & \textsc{#2, #3, #4}   								\\*
  \textsc{#5}    & \emph{#6} pour #7                       				\\*
  				       & 	\begin{minipage}[t]{\rightcolumnlength}
  						        #8
                   	\end{minipage}										\\*
                 & \footnotesize{\foreach \n in {#9}{\cvtag{\n}}} 	\\
  }


\newcommand\emptySeparator{\multicolumn{2}{c}{}\\}
