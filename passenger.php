<?php $passengers = $product['passengers'];
?>
    <div class="span1 prog-title pr">
        <?php echo $text_passenger?>
        <i class="x-icon x-left-arrow-white pa"></i>
    </div>
    <div id='passengers_info_editor'>
        <div class="pa form-field-write-tip">
            *为了更好的帮助您的出行，下列信息需要您帮我们补齐
        </div>
        <div class="span11 prog-body p-top-45">
            <div class="img-ctn pinfo-title span3">
                <?php echo $text_passenger_passenger?>
            </div>
            <div class="span9 tb-ctn">
                <div class="m-left-0 x_passer_all one-passer">

                    <table>
                    <?php $oneContact=false;
                       for($i = 0; $i < $product['selected_adult_quantity']; $i++) { ?>

                    <tr class="one-pitem">
                        <td class="span2"><span class="passer-type hide">成人</span><?php echo $entry_passenger_adult.($i+1)?></td>
                        <td class="span10">
                            <input class="x_chname" type="text" reg="^[\u4e00-\u9fa5]+$" tip="只允许中文字符" name="passengers[<?php echo $i;?>][zh_name]" value="<?php echo isset($passengers[$i])?$passengers[$i]['zh_name']:'';?>" placeholder="<?php echo $entry_passenger_zh_name?>" />
                            <input type="hidden" name="passengers[<?php echo $i;?>][is_child]" value="0" />
                            <input class="x_enname" type="text" reg="^[A-Za-z\s]+$" tip="只允许字母" name="passengers[<?php echo $i;?>][en_name]" value="<?php echo isset($passengers[$i])?$passengers[$i]['en_name']:'';?>" placeholder="<?php echo $entry_passenger_en_name?>" />
                            <?php if ($product['need_passenger_num'] == 1 ) {
                                    $oneContact=true;
                                ?>
                            <br />*请至少填写一位旅客的信息,以便取票时核对.
                            <?php }?>
                        </td>
                    </tr>
                    <?php if ($oneContact) {
                            break;
                        }
                    }?>
                    <?php for($j = $i,$childnum = 1; $j < $i + $product['selected_child_quantity']; $j++, $childnum++) {
                        if ($oneContact) {
                            break;
                        }
                    ?>
                        <tr class="one-pitem">
                            <td><span class="passer-type hide">儿童</span><?php echo $entry_passenger_child.($childnum)?></td>
                            <td>
                                <input class="x_chname" reg="^[\u4e00-\u9fa5]+$" tip="只允许中文字符" type="text" name="passengers[<?php echo $j;?>][zh_name]" value="<?php echo isset($passengers[$j])?$passengers[$j]['zh_name']:'';?>" placeholder="<?php echo $entry_passenger_zh_name?>" />
                                <input type="hidden" name="passengers[<?php echo $j;?>][is_child]" value="1" />

                                <input class="x_enname" reg="^[A-Za-z\s]+$" tip="只允许字母" type="text" name="passengers[<?php echo $j;?>][en_name]" value="<?php echo isset($passengers[$j])?$passengers[$j]['en_name']:'';?>" placeholder="<?php echo $entry_passenger_en_name?>" />

                                &nbsp;
                                <?php  echo $entry_passenger_child_age?>&nbsp;<select class="x_child_age" name="passengers[<?php echo $j;?>][child_age]">

                                    <?php
                                    $minAge = 2;$maxAge=18;
                                    if(!empty($product['child_age_range'])){
                                        $ages = explode('-',$product['child_age_range']);
                                        if(count($ages)==2 && (int)$ages[0] && (int)$ages[1]){
                                            $minAge = (int)$ages[0];
                                            $maxAge = (int)$ages[1];
                                        }
                                    }
                                    ?>
                                    <?php for ($k = $minAge; $k <= $maxAge; $k++) { ?>
                                    <option value="<?php echo $k; ?>" <?php if(isset($passengers[$j]) && isset($passengers[$j]['child_age']) && $passengers[$j]['child_age']==$k){echo 'selected="selected"';}?>><?php echo $k; ?></option>
                                    <?php }?>
                                </select>
                                <?php if ($product['need_passenger_num'] == 1) {
                                    $oneContact=true;
                                    ?>
                                    <br />*请至少填写一位旅客的信息,以便取票时核对.
                                <?php }?>
                            </td>
                        </tr>
                    <?php }?>
                    </table>
                </div>

            </div>
            <div class="prog-bot-border span11"></div>
        </div>

        <div class="span11 prog-body  contact-info">
            <div class="img-ctn pinfo-title span3" >
                <?php echo $text_passenger_contact?>
            </div>

            <div class="span9 tb-ctn  x_cotact_info_ctn" >
                <div class="pinfo-ctn">
                    <span class="pr contact-list span4"> <?php echo $entry_contact_history ?></span>
    					<span class="pr span8 p-checkbox-ctn">
                            <?php
                            $selected_address = array();
                            if ($addresses && count($addresses) > 0) {
                            foreach($addresses as $k=>$address){
                                $selected_css='';
                                if ($address_id == $address['address_id']) {
                                    $selected_address = $address;
                                    $selected_css='selected-unit';

                                }
                            ?>
    						<span id="address_unit_<?php echo $address['address_id'];?>" class="one-unit <?php echo$selected_css;?>">
    							<input type="radio" name="payment_address_id" id="address_id_<?php echo $address['address_id'];?>" value="<?php echo $address['address_id'];?>" <?php if($address_id == $address['address_id']){echo "checked";}?>>
                                <input type="hidden" id="address_name_<?php echo $address['address_id'];?>" value="<?php echo $address['firstname'];?>">
                                <input type="hidden" id="address_telephone_<?php echo $address['address_id'];?>" value="<?php echo $address['telephone'];?>">
                                <input type="hidden" id="address_passport_<?php echo $address['address_id'];?>" value="<?php echo $address['passport_number'];?>">
                                <input type="hidden" id="address_email_<?php echo $address['address_id'];?>" value="<?php echo $address['email'];?>">
    							<span class="p-label"><?php echo $address['firstname']?>
                                    <?php if ($address['address_id'] > 0) {?>
    								<i id="address_delete_<?php echo $address['address_id'];?>" class="x-login-check pa"></i>
                                    <?php }?>
    							</span>
    						</span>
                            <?php }}?>
                        </span>
                    <div class='clearfix'></div>
                </div>

                <div class="span6 m-left-0 one-passer">
                    <div class="row-fluid">
                        <div class="span4"><?php echo $entry_contact_name?></div>
                        <div class="span3"><input type="text" reg="^[\u4e00-\u9fa5]+$" tip="只允许中文字符" id="x_p_name" name="payment_address[firstname]" value=<?php if(isset($selected_address['firstname'])){echo $selected_address['firstname'];}?>></div>
                    </div>
                    <div class="row-fluid">
                        <div class="span4"><?php echo $entry_contact_telephone?></div>
                        <div class="span3"><input type="text" reg="^\d{11}$" tip="请填写手机号码" id="x_p_phone" name="payment_address[telephone]" value=<?php if(isset($selected_address['telephone'])){echo $selected_address['telephone'];}?>></div>
                    </div>
                </div>
                <div class="span6 m-left-0 one-passer info-2">

                    <div class="row-fluid">
                        <div class="span3"><?php echo $entry_contact_email?></div>
                        <div class="span3 pr">
                            <input type="text" reg="^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$" tip="邮箱地址，如wangking717@qq.com" id="x_p_email" name="payment_address[email]" value=<?php if(isset($selected_address['email'])){echo $selected_address['email'];}?>>
                            <i class="form-tip for-email pa">*此邮箱用于接收您的订单信息</i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="prog-bot-border span11"></div>

            <!--add .pr to op-panel, add .pa to .x_button, and replace .x_button with .x_save-->

        </div>
        <div class="op-panel">
            <button id="button_passenger" class="x-btn x-btn-green"><?php echo $button_passenger_confirm?></button>
        </div>
        <div class="" style="clear:both;"></div>
    </div>
    <div id="passengers_info_check" class="hide span11 prog-body for-table-tpl">
        <table class="table saved-table x_pinfo_tpl_ctn span5 offset1">

        </table>
        <table class="table saved-table span6">
            <thead>
            <tr>
                <th colspan="2"><?php echo $text_passenger_contact?></th>
            </tr>
            </thead>
            <tbody class="x_contact_tpl_ctn">

            </tbody>
        </table>

        <div class=" op-panel op-edit">
            <button id="x_editpasser_btn" class="btn x-btn-green x_save" style="bottom: -280px;"><?php echo $text_passenger_edit?></button>
        </div>

    </div>
<script>
(function($) {
    $('input[id^=\'address_id_\']').change(function(){
        var ids = $(this).attr('id').split('_');
        var address_id = ids[2];
        $('#x_p_name').val($('#address_name_'+address_id).val());
        $('#x_p_phone').val($('#address_telephone_'+address_id).val());
        $('#x_p_cartno').val($('#address_passport_'+address_id).val());
        $('#x_p_email').val($('#address_email_'+address_id).val());
    });

    $('#passenger').on("click", 'input[type="radio"]', function(e){
        var pointObj = $(this);
        var pointID = pointObj.attr('id');
        var key_items = pointID.split('_');
        var com_key = key_items[1]+'_'+key_items[2];
        $('#passenger input[id^=\'time_'+com_key+'\']').attr('checked', false);
        $('#passenger input[id^=\'point_'+com_key+'\']').attr('checked', false);
        $('#passenger input[id^=\'range_'+com_key+'\']').attr('checked', false);

        var time_id = pointID.replace('id_','time_');
        $('#passenger input[id=\''+time_id+'\']').attr('checked', true);
        var point_id = pointID.replace('id_','point_');
        $('#passenger input[id=\''+point_id+'\']').attr('checked', true);
        var range_id = pointID.replace('id_','range_');
        $('#passenger input[id=\''+range_id+'\']').attr('checked', true);
    });
})(window.jQuery);    
</script>