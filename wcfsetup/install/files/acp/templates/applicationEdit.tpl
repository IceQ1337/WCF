{include file='header' pageTitle='wcf.acp.application.edit'}

{if $application->packageID != 1 && !$application->isPrimary}
	<script type="text/javascript">
		//<![CDATA[
		$(function() {
			WCF.Icon.addObject({
				'wcf.icon.home': '{@$__wcf->getPath()}icon/home.svg'
			});
			WCF.Language.addObject({
				'wcf.acp.application.primaryApplication': '{lang}wcf.acp.application.primaryApplication{/lang}',
				'wcf.acp.application.setAsPrimary.confirmMessage': '{lang}wcf.acp.application.setAsPrimary.confirmMessage{/lang}',
				'wcf.acp.application.setAsPrimary.success': '{lang}wcf.acp.application.setAsPrimary.success{/lang}'
			});
			
			new WCF.ACP.Application.SetAsPrimary({@$application->packageID});
		});
		//]]>
	</script>
{/if}

<header class="boxHeadline">
	<hgroup>
		<h1>{lang}wcf.acp.application.edit.title{/lang}{if $application->isPrimary} <img src="{@$__wcf->getPath()}icon/home.svg" alt="" class="icon16 jsTooltip" title="{lang}wcf.acp.application.primaryApplication{/lang}" />{/if}</h1>
	</hgroup>
</header>

{if $errorField}
	<p class="error">{lang}wcf.global.form.error{/lang}</p>
{/if}

{if $success|isset}
	<p class="success">{lang}wcf.global.form.edit.success{/lang}</p>
{/if}

<div class="contentNavigation">
	<nav>
		<ul>
			{if $application->packageID != 1 && !$application->isPrimary}
				<li><a id="setAsPrimary" class="button"><img src="{@$__wcf->getPath()}icon/default.svg" alt="" class="icon24" /> <span>{lang}wcf.acp.application.setAsPrimary{/lang}</span></a></li>
			{/if}
			<li><a href="{link controller='ApplicationManagement'}{/link}" title="{lang}wcf.acp.application.management{/lang}" class="button"><img src="{@$__wcf->getPath()}icon/list.svg" alt="" class="icon24" /> <span>{lang}wcf.acp.application.management{/lang}</span></a></li>
			
			{event name='contentNavigationButtons'}
		</ul>
	</nav>
</div>

<form method="post" action="{link controller='ApplicationEdit' id=$application->packageID}{/link}">
	<div class="container containerPadding marginTop">
		<fieldset>
			<legend>{lang}wcf.acp.application.domain{/lang}</legend>
			
			<dl{if $errorField == 'domainName'} class="formError"{/if}>
				<dt><label for="domainName">{lang}wcf.acp.application.domainName{/lang}</label></dt>
				<dd>
					<input type="text" name="domainName" id="domainName" value="{$domainName}" class="long" />
					<small>{lang}wcf.acp.application.domainName.description{/lang}</small>
					{if $errorField == 'domainName'}
						<small class="innerError">
							{if $errorType == 'empty'}
								{lang}wcf.acp.global.form.error.empty{/lang}
							{else}
								{lang}wcf.acp.application.domainName.error.{$errorType}{/lang}
							{/if}
						</small>
					{/if}
				</dd>
			</dl>
			
			<dl>
				<dt><label for="domainPath">{lang}wcf.acp.application.domainPath{/lang}</label></dt>
				<dd>
					<input type="text" name="domainPath" id="domainPath" value="{$domainPath}" class="long" />
					<small>{lang}wcf.acp.application.domainPath.description{/lang}</small>
				</dd>
			</dl>
			
			{event name='domainFields'}
		</fieldset>
		
		<fieldset>
			<legend>{lang}wcf.acp.application.cookie{/lang}</legend>
			
			<p class="warning">{lang}wcf.acp.application.cookie.warning{/lang}</p>
			
			<dl class="marginTop {if $errorField == 'cookieDomain'} formError{/if}">
				<dt><label for="cookieDomain">{lang}wcf.acp.application.cookieDomain{/lang}</label></dt>
				<dd>
					<input type="text" name="cookieDomain" id="cookieDomain" value="{$cookieDomain}" class="long" />
					{if $errorField == 'cookieDomain'}
						<small class="innerError">
							{if $errorType == 'empty'}
								{lang}wcf.acp.global.form.error.empty{/lang}
							{else}
								{lang}wcf.acp.application.cookieDomain.error.{$errorType}{/lang}
							{/if}
						</small>
					{/if}
				</dd>
			</dl>
			
			<dl{if $errorField == 'cookiePath'} class="formError"{/if}>
				<dt><label for="cookiePath">{lang}wcf.acp.application.cookiePath{/lang}</label></dt>
				<dd>
					<input type="text" name="cookiePath" id="cookiePath" value="{$cookiePath}" class="long" />
					{if $errorField == 'cookiePath'}
						<small class="innerError">
							{if $errorType == 'empty'}
								{lang}wcf.acp.global.form.error.empty{/lang}
							{else}
								{lang}wcf.acp.application.cookiePath.error.{$errorType}{/lang}
							{/if}
						</small>
					{/if}
				</dd>
			</dl>
			
			{event name='cookieFields'}
		</fieldset>
		
		{event name='fieldsets'}
	</div>
	
	<div class="formSubmit">
		<input type="submit" value="{lang}wcf.global.button.submit{/lang}" accesskey="s" />
	</div>
</form>

{include file='footer'}
