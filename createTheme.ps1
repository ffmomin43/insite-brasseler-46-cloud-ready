param (
    [string]$themeName,
    [string]$copyFromThemeName
)

function returnError($message)
{
    $initialBG = $Host.Ui.RawUI.BackgroundColor
    $initialFG = $Host.Ui.RawUI.ForegroundColor
    $Host.UI.RawUI.BackgroundColor = "Red"
    write-output $message
    $Host.Ui.RawUI.BackgroundColor = $initialBG
    exit 1
}

function Get-ScriptDirectory
{
    $Invocation = (Get-Variable MyInvocation -Scope 1).Value;
    if($Invocation.PSScriptRoot)
    {
        $Invocation.PSScriptRoot;
    }
    Elseif($Invocation.MyCommand.Path)
    {
        Split-Path $Invocation.MyCommand.Path
    }
    else
    {
        $Invocation.InvocationName.Substring(0,$Invocation.InvocationName.LastIndexOf("\"));
    }
}

if ($themeName -eq "") {
    returnError "Please specify a -themeName"
}

$themePath = (Get-ScriptDirectory) + "\InsiteCommerce.Web\Themes\$themeName"

if (Test-Path $themePath) {
    returnError "The theme $themeName already exists at $themePath"
}

if ($copyFromThemeName -eq "") {
    $sourceThemePath = (Get-ScriptDirectory) + "\InsiteCommerce.Web\_systemResources\themes\responsive"
    $copyFromThemeName = "Responsive"
}
else {
    $sourceThemePath = (Get-ScriptDirectory) + "\InsiteCommerce.Web\themes\$copyFromThemeName"
}

if (-Not(Test-Path $sourceThemePath)) {
    returnError "There was no theme found called $copyFromThemeName at $sourceThemePath found to copy from"
}

New-Item $themePath -type directory > $null

& xcopy $sourceThemePath $themePath /y /s /r > $null

$themeJsonPath = $themePath + "\theme.json"

if (-Not(Test-Path $themeJsonPath)) {
    $themeJsonBakPath = $themePath + "\theme.json.bak"
    if (-Not(Test-Path $themeJsonBakPath)) {
        Remove-Item $themePath -Force -Recurse

        returnError "There was no theme.json or theme.json.bak file found in the source theme."
    }
    Rename-Item -Path $themeJsonBakPath -NewName $themeJsonPath
}

$reader = [System.IO.File]::OpenText($themeJsonPath)
$themeJsonContent = New-Object System.Text.StringBuilder
while($null -ne ($line = $reader.ReadLine())) {
    if ($line.Trim().StartsWith("`"Name`": ")) {
        $line = "  `"Name`": `"$themeName`",";
    }
    elseif ($line.Trim().StartsWith("`"Description`": ")) {
        $line = "  `"Description`": `"The $themeName Theme`",";
    }
    elseif ($line.Trim().StartsWith("`"ParentTheme`": ")) {
        $line = "  `"ParentTheme`": `"$copyFromThemeName`",";
    }
    $themeJsonContent.AppendLine($line) > $null
}

$reader.Close()

Set-Content -Path $themeJsonPath -Value $themeJsonContent.ToString() -Force

$itemGroup = ""

foreach($file in Get-ChildItem $themePath -Recurse) {
    if ($file.FullName.ToLower().EndsWith(".ts")) {
        $itemGroup += "<TypeScriptCompile Include=`"" + $file.FullName.Substring($themePath.Length + 1) + "`" />`n"
    }
    elseif ($file.FullName.ToLower().EndsWith(".css")) {
        $scssPath = $file.FullName.Substring(0, $file.FullName.Length - 4) + ".scss"
        if (-not (Test-Path $scssPath)) {
            $itemGroup += "<Content Include=`"" + $file.FullName.Substring($themePath.Length + 1) + "`" />`n"
        }
    }
    elseif ($file.FullName.ToLower().EndsWith(".cshtml") -or $file.FullName.ToLower().EndsWith(".liquid") -or $file.FullName.ToLower().EndsWith(".json") -or $file.FullName.ToLower().EndsWith(".scss")) {
        $itemGroup += "<Content Include=`"" + $file.FullName.Substring($themePath.Length + 1) + "`" />`n"
    }
}

$projectId = [guid]::NewGuid()

$solutionFilePath = (Get-ScriptDirectory) + "\insitecommerce.sln"

$reader = [System.IO.File]::OpenText($solutionFilePath)
$solutionFileContent = New-Object System.Text.StringBuilder
while($null -ne ($line = $reader.ReadLine())) {
    if ($line -eq "Global") {
        $solutionFileContent.AppendLine("Project(`"{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}`") = `"$themeName`", `"InSiteCommerce.Web\Themes\$themeName\$themeName.csproj`", `"{$projectId}`"
EndProject") > $null
        $solutionFileContent.AppendLine($line) > $null
    }
    elseif ($line.Trim() -eq "GlobalSection(ProjectConfigurationPlatforms) = postSolution") {
        $solutionFileContent.AppendLine($line) > $null
        $solutionFileContent.AppendLine("		{$projectId}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{$projectId}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{$projectId}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{$projectId}.Release|Any CPU.Build.0 = Release|Any CPU") > $null
    }
    else {
        $solutionFileContent.AppendLine($line) > $null
    }
}

$reader.Close()

Set-Content -Path $solutionFilePath -Value $solutionFileContent.ToString() -Force

$tsConfigFile = "{
  `"compileOnSave`": true,
  `"compilerOptions`": {
    `"module`": `"commonjs`",
    `"target`": `"es5`",
    `"sourceMap`": true
  },
  `"exclude`": [
    `"node_modules`",
    `"bin`"
  ]
}"

$tsConfigFilePath = "$themePath\tsconfig.json"
Set-Content -Path $tsConfigFilePath -Value $tsConfigFile -Force

$projectFile = "<Project ToolsVersion=`"12.0`" DefaultTargets=`"Build`" xmlns=`"http://schemas.microsoft.com/developer/msbuild/2003`">
  <Import Project=`"`$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v`$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.Default.props`" Condition=`"Exists('`$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v`$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.Default.props')`" />
  <Import Project=`"`$(MSBuildExtensionsPath)\`$(MSBuildToolsVersion)\Microsoft.Common.props`" Condition=`"Exists('`$(MSBuildExtensionsPath)\`$(MSBuildToolsVersion)\Microsoft.Common.props')`" />
  <PropertyGroup>
    <Configuration Condition=`" '`$(Configuration)' == '' `">Debug</Configuration>
    <Platform Condition=`" '`$(Platform)' == '' `">AnyCPU</Platform>
    <ProductVersion>
    </ProductVersion>
    <SchemaVersion>2.0</SchemaVersion>
    <ProjectGuid>{$projectId}</ProjectGuid>
    <ProjectTypeGuids>{349c5851-65df-11da-9384-00065b846f21};{fae04ec0-301f-11d3-bf4b-00c04f79efbc}</ProjectTypeGuids>
    <OutputType>Library</OutputType>
    <AppDesignerFolder>Properties</AppDesignerFolder>
    <RootNamespace>$themeName</RootNamespace>
    <AssemblyName>$themeName</AssemblyName>
    <TargetFrameworkVersion>v4.8</TargetFrameworkVersion>
    <UseIISExpress>true</UseIISExpress>
    <IISExpressSSLPort />
    <IISExpressAnonymousAuthentication />
    <IISExpressWindowsAuthentication />
    <IISExpressUseClassicPipelineMode />
    <UseGlobalApplicationHostFile />
    <TypeScriptToolsVersion>3.7</TypeScriptToolsVersion>
    <NuGetPackageImportStamp>
    </NuGetPackageImportStamp>
  </PropertyGroup>
  <PropertyGroup Condition=`" '`$(Configuration)|`$(Platform)' == 'Debug|AnyCPU' `">
    <DebugSymbols>true</DebugSymbols>
    <DebugType>full</DebugType>
    <Optimize>false</Optimize>
    <OutputPath>bin\</OutputPath>
    <DefineConstants>DEBUG;TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
    <TypeScriptTarget>ES5</TypeScriptTarget>
    <TypeScriptJSXEmit>None</TypeScriptJSXEmit>
    <TypeScriptCompileOnSaveEnabled>True</TypeScriptCompileOnSaveEnabled>
    <TypeScriptNoImplicitAny>False</TypeScriptNoImplicitAny>
    <TypeScriptModuleKind>CommonJS</TypeScriptModuleKind>
    <TypeScriptRemoveComments>False</TypeScriptRemoveComments>
    <TypeScriptOutFile />
    <TypeScriptOutDir />
    <TypeScriptGeneratesDeclarations>False</TypeScriptGeneratesDeclarations>
    <TypeScriptNoEmitOnError>False</TypeScriptNoEmitOnError>
    <TypeScriptSourceMap>True</TypeScriptSourceMap>
    <TypeScriptMapRoot />
    <TypeScriptSourceRoot />
  </PropertyGroup>
  <PropertyGroup Condition=`" '`$(Configuration)|`$(Platform)' == 'Release|AnyCPU' `">
    <DebugSymbols>true</DebugSymbols>
    <DebugType>pdbonly</DebugType>
    <Optimize>true</Optimize>
    <OutputPath>bin\</OutputPath>
    <DefineConstants>TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
  </PropertyGroup>
  <ItemGroup>
    <Service Include=`"{4A0DDDB5-7A95-4FBF-97CC-616D07737A77}`" />
  </ItemGroup>
  <ItemGroup>
    <Content Include=`"tsconfig.json`" />
    $itemGroup
  </ItemGroup>
  <PropertyGroup>
    <VisualStudioVersion Condition=`"'`$(VisualStudioVersion)' == ''`">10.0</VisualStudioVersion>
    <VSToolsPath Condition=`"'`$(VSToolsPath)' == ''`">`$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v`$(VisualStudioVersion)</VSToolsPath>
  </PropertyGroup>
  <Import Project=`"`$(MSBuildBinPath)\Microsoft.CSharp.targets`" />
  <Import Project=`"`$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v`$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets`" Condition=`"Exists('`$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v`$(VisualStudioVersion)\TypeScript\Microsoft.TypeScript.targets')`" />
  <Import Project=`"`$(VSToolsPath)\WebApplications\Microsoft.WebApplication.targets`" Condition=`"'`$(VSToolsPath)' != ''`" />
  <Import Project=`"`$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v10.0\WebApplications\Microsoft.WebApplication.targets`" Condition=`"false`" />
  <ProjectExtensions>
    <VisualStudio>
      <FlavorProperties GUID=`"{349c5851-65df-11da-9384-00065b846f21}`">
        <WebProjectProperties>
          <UseIIS>True</UseIIS>
          <AutoAssignPort>True</AutoAssignPort>
          <DevelopmentServerPort>52642</DevelopmentServerPort>
          <DevelopmentServerVPath>/</DevelopmentServerVPath>
          <IISUrl>http://localhost:52642/</IISUrl>
          <NTLMAuthentication>False</NTLMAuthentication>
          <UseCustomServer>False</UseCustomServer>
          <CustomServerUrl>
          </CustomServerUrl>
          <SaveServerSettingsInUserFile>False</SaveServerSettingsInUserFile>
        </WebProjectProperties>
      </FlavorProperties>
    </VisualStudio>
  </ProjectExtensions>
  <Target Name=`"EnsureNuGetPackageBuildImports`" BeforeTargets=`"PrepareForBuild`">
    <PropertyGroup>
      <ErrorText>This project references NuGet package(s) that are missing on this computer. Use NuGet Package Restore to download them.  For more information, see http://go.microsoft.com/fwlink/?LinkID=322105. The missing file is {0}.</ErrorText>
    </PropertyGroup>
  </Target>
  <!-- To modify your build process, add your task inside one of the targets below and uncomment it. 
       Other similar extension points exist, see Microsoft.Common.targets.
  <Target Name=`"BeforeBuild`">
  </Target>
  <Target Name=`"AfterBuild`">
  </Target>
  -->
</Project>"

$csProject = "$themePath\$themeName.csproj"

Add-Content $csProject $projectFile
