---
title: 工具类开发之excel模板导出（带单选下拉框、多选下拉框、单选下拉级联）
comments: true
date: 2020-11-11 15:30:11
tags:
  - 工具类
  - excel
categories:
  - java
keywords: excel导出,excel下拉框,下拉级联,多选下拉excel
description: 实现excel带下拉框导出模板，适配多种情况，配置简单灵活
cover: /img/blog_excel-util.jpg
---
# 背景
项目新需求，要求导出excel模板时，某些字段限制手动输入，只能下拉选择数据，并且可以多字段级联选择、多选。于是，借鉴了些大佬的操作，东拼西凑总算将要用到的功能整合到一起了。废话不多说，直接撸代码。
# 实现步骤
## 先来个配置类自定义注解
```java
@Retention(RetentionPolicy.RUNTIME)  
@Target( { java.lang.annotation.ElementType.FIELD }) 
public @interface ExcelAnnotation {
	 /** 
     * 导出到Excel中的名字. 
     */  
    public abstract String name();  
    /** 
     * 配置列号,对应0，1，2，3.... 
     */  
    public abstract int column();  
    /** 
     * 该字段是否导出 默认true
     */   
    public abstract boolean isExport() default true;  
    /** 
     * 表头批注 
     */  
    public abstract String prompt()  default "";    
    /** 
     * 是否是下拉框
     */  
    public abstract boolean isCombo()  default false;    
    /** 
     * 父字段列号（下拉框联动）
     */  
    public abstract int parentFieldColumn()  default 0;    
    /** 
     * 下拉框数据
     */  
    public abstract String comboValue()  default "";    
}
```
将该注解配置到具体实现类上用来配置导出信息，包括导出的字段、字段顺序、表头批注等等，具体使用如下
```java
public class FileExportVo {
	
	@ExcelAnnotation(name="文档路径",column=0)
	private String filepath;
	
	@ExcelAnnotation(name="文档版本",column=1,isCombo=true)
	private String fileversion;
	
	@ExcelAnnotation(name="文档描述",column=2)
	private String filenote;
	
	@ExcelAnnotation(name="文档属性",column=3,isCombo=true)
	private String filesource;
	
	@ExcelAnnotation(name="所属部门",column=4,isCombo=true)
	private String dep;
	
	@ExcelAnnotation(name="是否正式文档",column=5,isCombo=true)
	private String fileflag;
	
	@ExcelAnnotation(name="文档合规属性",column=6,isCombo=true)
	private String fileproperty; 
	
	@ExcelAnnotation(name="文档类型",column=7,isCombo=true)
	private String typeid;
	
	@ExcelAnnotation(name="作者",column=8)
	private String author;
	@ExcelAnnotation(name="文档语言",column=9,isCombo=true)
	private String filelang;
	
	@ExcelAnnotation(name="适用OS版本",column=10,isCombo=true)
	private String androidversion;
	
	@ExcelAnnotation(name="文档关键字",column=11,isCombo=true)
	private String keywords;
	
	@ExcelAnnotation(name="备注",column=12,isCombo=true)
	private String fileremark;
	
	@ExcelAnnotation(name="文档适用平台",column=13,isCombo=true)
	private String filechips;
}
```
## Excel工具类入口
```java
/**
 * 
 *  @Description:TODO(导出Excel 模板/数据（可配置下拉列表）)
 *  @Explain 在实体类字段上添加ExcelAnnotation注解，配置相应信息即可使用
 *  @param fileName 导出文件名
 *  @param sheetName 工作簿
 *  @param clazz 实体对象的Class
 *  @param comboParams 参数数据 1、表头提示/下拉框待选数据；
 *  @param comboParams 参数数据 2、Map<字段,Map<(prompt/comboValue),Object>；
 *  @param comboParams 参数数据 3、comboValue下拉框数据 直接传入对象list；prompt批注直接传入字符串信息即可；
 *  @param values 导出数据
 *  @param wb wb
 *  @param response response
 *  @return
 *  @throws Exception
 */
public static XSSFWorkbook getXSSFWorkbook(String fileName,String sheetName, Class<?> clazz,Map<String,Map<String,Object>> comboParams,List<?> values, XSSFWorkbook wb,HttpServletResponse response) throws Exception {
	// 第一步，创建一个XSSFWorkbook，对应一个Excel文件
	if (wb == null) {
		wb = new XSSFWorkbook();
	}
	// 第二步，在workbook中添加一个sheet,对应Excel文件中的sheet
	XSSFSheet sheet = wb.getSheet("Sheet1");

	// 第三步，在sheet中添加表头第0行,注意老版本poi对Excel的行数列数有限制
	XSSFRow row = sheet.createRow(0);

	// 第四步，创建单元格，并设置值表头 设置表头居中
	XSSFCellStyle style = wb.createCellStyle();
	style.setAlignment(HSSFCellStyle.ALIGN_CENTER); // 创建一个居中格式
	style.setWrapText(true);// 自动换行

	// 声明列对象
	XSSFCell cell = null;
	
	//参数数据（下拉框参数，head提示信息）
	if(comboParams!=null) {
		for(String field:comboParams.keySet()) {
			//参数，类型(combo,prompt):数据
			Map<String,Object> param=comboParams.get(field);
			for(String type:param.keySet()) {
				setClassExcelAnnotation(clazz, field, type, param.get(type));
			}
		}
	}
	//获取字段
	Field[] fields=clazz.getDeclaredFields();
	for (int i = 0; i < fields.length; i++) {  
		Field field = fields[i];
		ExcelAnnotation attr = field.getAnnotation(ExcelAnnotation.class);  
		if (attr != null) {
			boolean isExport=attr.isExport();//是否导出
			if(isExport) {
				int col = attr.column();// 获得列号
				cell = row.createCell(col);// 创建列  
				cell.setCellType(HSSFCell.CELL_TYPE_STRING);// 设置列中写入内容为String类型  
				cell.setCellValue(attr.name());  
				// 如果设置了提示信息则鼠标放上去提示.  
				if (!attr.prompt().trim().equals("")) {
					setXSSFPrompt(sheet, attr.prompt(),cell); 
				}
				// 如果设置了combo属性则本列只能选择或者输入下拉中的内容  
				if (attr.isCombo()) {
					setXSSFValidation(sheet,field.getName(),attr,wb);
				}  
				cell.setCellStyle(style);  
			}
		}
	 }  

	// 创建内容
	if(values!=null) {
		for (int i = 0; i < values.size(); i++) {
			row = sheet.createRow(i + 1);
			ExcelAnnotation attr =null;
			for (int j = 0; j < fields.length; j++) {  
				Field declaredField = fields[j];
				attr = declaredField.getAnnotation(ExcelAnnotation.class);  
				if (attr != null) {
					//是否导出
					boolean isExport=attr.isExport();
					if(isExport) {
						// 获得列号  
						int col = attr.column();
						declaredField.setAccessible(true);
						//获取数据
						Object val;
						String value = "";
						try {
							val = declaredField.get(values.get(i));
							if(val!=null) {
								if(val.getClass().toString().equals("class java.util.Date")){
									value=DateUtil.date2StringDate((Date)val);
								}else{
									value=val.toString();
								}
							}
						} catch (IllegalArgumentException e) {
							e.printStackTrace();
						} catch (IllegalAccessException e) {
							e.printStackTrace();
						}
						row.createCell(col).setCellValue(value);
					}
				}
			}  
		}
	}else {
		//导出模板 模拟50条空数据
		for (int i = 1; i <= 50; i++) {
			creatAppRow(sheet,i,fields);
			
		}
	}
	//响应到客户端
	if(response!=null) {
		try {
			setResponseHeader(response, fileName);
			OutputStream os = response.getOutputStream();
			wb.write(os);
			os.flush();
			os.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	return wb;
}
```

## 添加下拉数据验证
```java
 /**
 * 
 *  @Description:设置下拉数据验证
 *  由于下列是不确定是所以不能保证不超过255故用隐藏页来放置下列信息
 *  @param sheet
 *  @param textlist
 *  @param wb
 *  @return
 */
@SuppressWarnings("unchecked")
private static void setXSSFValidation(XSSFSheet sheet,String fieldName,ExcelAnnotation attr, XSSFWorkbook wb) {
	// 获取所有sheet页个数
	int sheetTotal = wb.getNumberOfSheets();
	String hiddenSheetName = "hiddenSheet" + sheetTotal;
	XSSFSheet hiddenSheet = wb.createSheet(hiddenSheetName);
	//下拉数据
	String comboValue=attr.comboValue();
	Object obj=JSON.parse(comboValue);
	Map<String,Object> comboValues=new HashMap<String,Object>();
	if(obj instanceof Map) {
		comboValues=(Map<String,Object>) obj;
	}else {
		comboValues.put(fieldName, obj);
	}
	Row row;
	Cell cell;
	Name name;
	int i=0;
	for (String key : comboValues.keySet()) {
		
		if(i==0) {
			//创建一行
			row = hiddenSheet.createRow(0);
		}else {
			//获取行
			row=hiddenSheet.getRow(0);
		}
		//创建列
		cell = row.createCell(i);
		//给列设置值
		cell.setCellValue(key);
		JSONArray jsonArray=(JSONArray) comboValues.get(key);
		for (int j = 1; j <= jsonArray.size(); j++) {
			row=hiddenSheet.getRow(j);
			if(row==null) {
				row=hiddenSheet.createRow(j);
			}
			cell = row.getCell(i);
			if(cell==null) {
				cell = row.createCell(i);
			}
			Object ob=jsonArray.getObject(j-1, Object.class);
			cell.setCellValue((String)ob);
		}
		name = wb.createName();
		name.setNameName(key.toString());
		name.setRefersToFormula(hiddenSheetName + "!$"+getcellColumnFlag(i)+"$2:$"+getcellColumnFlag(i)+"$"+(jsonArray.size()+1));
		i++;
	}
	//隐藏数据源
	wb.setSheetHidden(sheetTotal, true);
}
```

## 创建数据
```java
 /**
 * 
 *  @Description:TODO(创建数据)
 *  @param xssfSheet sheet
 *  @param naturalRowIndex 行标
 */
public static void creatAppRow(XSSFSheet xssfSheet, int naturalRowIndex,Field[] fields) {
	//看有多少下拉框验证 添加验证数据
	for (int i = 0; i < fields.length; i++) {  
		Field field = fields[i];
		ExcelAnnotation attr = field.getAnnotation(ExcelAnnotation.class);  
		if (attr != null) {
			boolean isExport=attr.isExport();//是否导出
			if(isExport) {
				int col = attr.column();// 获得列号
				int parentFieldColumn=attr.parentFieldColumn();//父节点列号
				if (attr.isCombo()) {  
					if(parentFieldColumn!=0) {
						 //联动
						DataValidation data_validation = getDataValidationByFormula(xssfSheet,"INDIRECT($"+getcellColumnFlag(parentFieldColumn)+(naturalRowIndex+1)+")",naturalRowIndex,col);
						xssfSheet.addValidationData(data_validation);
					}else {
						DataValidation data_validation = getDataValidationByFormula(xssfSheet,field.getName(), naturalRowIndex, col);
						xssfSheet.addValidationData(data_validation);
					}
				}
			}
		}
	 }  
}
```

## 设置数据验证
```java
/**
 * 
 *  @Description:TODO(使用已定义的数据源方式设置一个数据验证)
 *  @param formulaString
 *  @param row
 *  @param col
 */
public static DataValidation getDataValidationByFormula(XSSFSheet xssfSheet,String formulaString,
		int row, int col) {
	  // 加载下拉列表内容
	XSSFDataValidationHelper dvHelper = new XSSFDataValidationHelper(xssfSheet);
	XSSFDataValidationConstraint dvConstraint =(XSSFDataValidationConstraint) dvHelper.createFormulaListConstraint(formulaString);

	// 设置数据有效性加载在哪个单元格上。
	// 四个参数分别是：起始行、终止行、起始列、终止列
	CellRangeAddressList regions = new CellRangeAddressList(1,65535, col, col);
	// 数据有效性对象
	XSSFDataValidation data_validation_list =(XSSFDataValidation) dvHelper.createValidation(dvConstraint, regions);
	//禁止手动填写 经测试 直接粘贴也可以
	data_validation_list.setSuppressDropDownArrow(true);
	data_validation_list.setShowErrorBox(true);
	return data_validation_list;
}
/**
 * 
 *  @Description:TODO(获取列名)
 *  @param num 下标
 *  @return
 */
private static String getcellColumnFlag(int num) {
	String columFiled = "";
	int chuNum = 0;
	int yuNum = 0;
	if (num >= 0 && num <= 25) {
		columFiled = doHandle(num);
	} else {
		chuNum = (num / 26)-1;
		yuNum = num % 26;

		columFiled += doHandle(chuNum);
		columFiled += doHandle(yuNum);
	}
	return columFiled;
}
private static String doHandle(final int num) {
	String[] charArr = { "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
			"K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
			"W", "X", "Y", "Z" };
	return charArr[num];
}
/**
 * 
 *  @Description:TODO(添加表头批注)
 *  @param sheet
 *  @param textlist
 *  @param cell
 *  @return
 */
private static XSSFSheet setXSSFPrompt(XSSFSheet sheet, String textlist, XSSFCell  cell) {
	 // 创建HSSFPatriarch对象,HSSFPatriarch是所有注释的容器.
	XSSFDrawing patr = sheet.createDrawingPatriarch();
	// 定义注释的大小和位置,详见文档
	XSSFComment comment = patr.createCellComment(new XSSFClientAnchor(0, 0, 0, 0, (short)4, 2, (short) 6, 5));
	// 设置注释内容
	comment.setString(new XSSFRichTextString(textlist));
	// 设置注释作者. 当鼠标移动到单元格上是可以在状态栏中看到该内容.
	cell.setCellComment(comment);//添加注释

	return sheet;
}
```

## 反射操作类
```java
/**
 * 
 *  @Description:TODO(利用反射动态修改注解)
 *  @param clazz 类
 *  @param declareField 对象字段
 *  @param memberKey 注解字段
 *  @param memberValue 注解字段 对应的数据
 *  @throws Exception
 */
@SuppressWarnings("unchecked")
public static void setClassExcelAnnotation(Class<?> clazz, String declareField, String memberKey, Object memberValue)
		throws Exception {
	Field declaredField = clazz.getDeclaredField(declareField);
	declaredField.setAccessible(true);
	ExcelAnnotation annotation = declaredField.getAnnotation(ExcelAnnotation.class);
	if (annotation != null) {
		InvocationHandler ih = Proxy.getInvocationHandler(annotation);
		Field memberValuesField = ih.getClass().getDeclaredField("memberValues");
		memberValuesField.setAccessible(true);
		Map<String, Object> memberValues = (Map<String, Object>) memberValuesField.get(ih);
		if(memberValue instanceof String) {
			//参数本身就是字符串（prompt）
			memberValues.put(memberKey, memberValue);
		}else {
			//数组/集合类型 需要转成json字符串
			memberValues.put(memberKey, JSON.toJSONString(memberValue));
		}
	}
}

/**
 * 
 *  @Description:TODO(通过反射的方式获取字段的值)
 *  @param clazz 类
 *  @param declareField 对象字段
 *  @param list 下拉数据
 *  @return
 *  @throws Exception
 */
public static String[] getClassFieldValueList(Class<?> clazz, String declareField, List<?> list) throws Exception {
	String[] strArray = new String[list.size()];
	int index = 0;
	for (Object object : list) {
		//多个字段拼接
		String declareFields[]=declareField.split(",");
		String str ="";
		Field declaredField;
		for(String fields:declareFields) {
			declaredField = clazz.getDeclaredField(fields);
			declaredField.setAccessible(true);
			if(str.equals("")) {
				str = declaredField.get(object).toString();
			}else {
				str += "("+declaredField.get(object).toString()+")";
			}
		}
		strArray[index++] = str;
	}
	return strArray;
}

```

# 多选下拉
由于多选比较特殊，excel本身只支持单选的，但是我们可以利用‘宏’让Excel支持多选，所以需要先用宏设置好哪些列需要多选，然后导入预先设置好宏的excel模板，然后在它的基础上再实现其他功能即可。

## 创建模板 
新建excel 然后打开‘宏’->创建宏->编辑代码
```vb
Sub Worksheet_Change(ByVal Target As Range)
'让数据有效性选择 可以多选,不可重复
Dim rngDV As Range
Dim oldVal As String

Dim newVal As String
If Target.Count > 1 Then GoTo exitHandler

On Error Resume Next
Set rngDV = Cells.SpecialCells(xlCellTypeAllValidation)
On Error GoTo exitHandler

If rngDV Is Nothing Then GoTo exitHandler

If Intersect(Target, rngDV) Is Nothing Then
'do nothing

Else
Application.EnableEvents = False
newVal = Target.Value
If Target.Column = 11 Or Target.Column = 12 Or Target.Column = 14 Then  '数字是你想要多选的列是多少，多个用or连接。
Application.Undo
oldVal = Target.Value
Target.Value = newVal
If oldVal = "" Then
Else
If newVal = "" Then
Else '去除重复的字段
       If InStr(1, oldVal, newVal) <> 0 Then
          If InStr(1, oldVal, newVal) + Len(newVal) - 1 = Len(oldVal) Then '最后一个选项重复
            Target.Value = Left(oldVal, Len(oldVal) - Len(newVal) - 1)
          Else
            Target.Value = Replace(oldVal, newVal & ",", "") '不是最后一个选项重复的时候处理逗号
          End If
        Else '不是重复选项就视同增加选项
Target.Value = oldVal _
& "," & newVal '可以是任意符号隔开
End If
End If
End If
End If
End If
exitHandler:
Application.EnableEvents = True
End Sub
```

## 调用 导出模板
```java
Map<String,Map<String,Object>>map=new HashMap<String, Map<String,Object>>();
//下拉框数据
Map<String,Object>param_chips=new HashMap<String, Object>();
List<String>chips=platformChipApproverMapper.selectChipToPdt();
param_chips.put("comboValue", chips);
map.put("filechips",param_chips);

//导入模板 (因为需要多选 所以要先导入一个已经设置好多选的excel模板)
InputStream input = new FileInputStream(new File(EXCEL_TEMPLATE));
XSSFWorkbook workbook=new XSSFWorkbook(input);
ExcelUtil.getXSSFWorkbook("文档批量上传模板","Sheet1", FileExportVo.class, map, null, workbook,response);
```
